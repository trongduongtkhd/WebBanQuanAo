import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { UserProfile } from '../../../../core/models/profile.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;

  loading = true;
  savingProfile = false;
  changingPassword = false;

  profileSuccessMessage = '';
  profileErrorMessage = '';

  passwordSuccessMessage = '';
  passwordErrorMessage = '';

  profileForm = this.fb.group({
    fullName: ['', [Validators.required, Validators.maxLength(150)]],
    phoneNumber: ['', Validators.maxLength(20)],
    avatarUrl: ['', Validators.maxLength(500)],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmNewPassword: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading = true;

    this.userProfileService.getProfile().subscribe({
      next: (response) => {
        this.profile = response.data;

        this.profileForm.patchValue({
          fullName: this.profile.fullName,
          phoneNumber: this.profile.phoneNumber || '',
          avatarUrl: this.profile.avatarUrl || '',
        });

        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.profileErrorMessage =
          error?.error?.message || 'Không thể tải thông tin cá nhân.';
      },
    });
  }

  saveProfile(): void {
    this.profileSuccessMessage = '';
    this.profileErrorMessage = '';

    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const value = this.profileForm.value;

    this.savingProfile = true;

    this.userProfileService
      .updateProfile({
        fullName: value.fullName!.trim(),
        phoneNumber: value.phoneNumber?.trim() || null,
        avatarUrl: value.avatarUrl?.trim() || null,
      })
      .subscribe({
        next: (response) => {
          this.profile = response.data;
          this.savingProfile = false;

          this.profileSuccessMessage = response.message;

          // Header cập nhật ngay sau khi đổi tên/avatar.
          this.authService.updateCurrentUser(response.data);
        },
        error: (error) => {
          this.savingProfile = false;
          this.profileErrorMessage =
            error?.error?.message || 'Không thể cập nhật hồ sơ.';
        },
      });
  }

  changePassword(): void {
    this.passwordSuccessMessage = '';
    this.passwordErrorMessage = '';

    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const value = this.passwordForm.value;

    if (value.newPassword !== value.confirmNewPassword) {
      this.passwordErrorMessage = 'Xác nhận mật khẩu mới không khớp.';
      return;
    }

    this.changingPassword = true;

    this.userProfileService
      .changePassword({
        currentPassword: value.currentPassword!,
        newPassword: value.newPassword!,
        confirmNewPassword: value.confirmNewPassword!,
      })
      .subscribe({
        next: (response) => {
          this.changingPassword = false;
          this.passwordSuccessMessage = response.message;
          this.passwordForm.reset();
        },
        error: (error) => {
          this.changingPassword = false;
          this.passwordErrorMessage =
            error?.error?.message || 'Không thể đổi mật khẩu.';
        },
      });
  }

  get avatarPreview(): string {
    return (
      this.profileForm.get('avatarUrl')?.value?.trim() ||
      'assets/images/avatar-placeholder.png'
    );
  }

  getInitials(): string {
    const fullName = this.profileForm.get('fullName')?.value || '';

    return (
      fullName
        .trim()
        .split(/\s+/)
        .slice(-2)
        .map((x: string) => x.charAt(0))
        .join('')
        .toUpperCase() || 'U'
    );
  }

  onAvatarError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = 'assets/images/avatar-placeholder.png';
  }

  isInvalid(formName: 'profile' | 'password', controlName: string): boolean {
    const form = formName === 'profile' ? this.profileForm : this.passwordForm;

    const control = form.get(controlName);

    return !!control && control.invalid && (control.touched || control.dirty);
  }
}
