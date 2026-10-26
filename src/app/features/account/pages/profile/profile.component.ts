import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserProfileService } from '../../../../core/services/user-profile.service';
import { UserProfile } from '../../../../core/models/profile.model';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import {
  FULL_NAME_MESSAGE, normalizeFullName, normalizePhone, passwordErrorMessage,
  personNameValidator, PHONE_MESSAGE, strongPasswordValidator, vietnameseMobileValidator,
} from '../../../../core/utils/account-validation.util';

// Giới hạn độ dài khớp [StringLength] ở UpdateProfileDto (backend).
const PROFILE_FIELDS = {
  fullName: { label: 'Họ tên', max: 150 },
  phoneNumber: { label: 'Số điện thoại', max: 20 },
} as const;

type ProfileFieldName = keyof typeof PROFILE_FIELDS;

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
    fullName: [
      '',
      [
        Validators.required,
        personNameValidator,
      ],
    ],
    phoneNumber: ['', vietnameseMobileValidator],
    avatarUrl: ['', Validators.maxLength(500)],
  });

  passwordForm = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, strongPasswordValidator]],
    confirmNewPassword: ['', Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private userProfileService: UserProfileService,
    private authService: AuthService,
    private router: Router,
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
    if (this.savingProfile) { return; }
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
        fullName: normalizeFullName(value.fullName ?? ''),
        phoneNumber: normalizePhone(value.phoneNumber),
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
          this.profileErrorMessage = getApiErrorMessage(
            error,
            'Không thể cập nhật hồ sơ.',
          );
        },
      });
  }

  changePassword(): void {
    if (this.changingPassword) { return; }
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
        next: () => {
          // Server đã thu hồi mọi refresh token (kể cả thiết bị này) => xoá phiên và yêu cầu đăng nhập lại.
          this.changingPassword = false;
          this.authService.clearSession();
          this.router.navigate(['/auth/login'], {
            queryParams: { passwordChanged: 1 },
          });
        },
        error: (error) => {
          this.changingPassword = false;
          this.passwordErrorMessage = getApiErrorMessage(error, 'Không thể đổi mật khẩu.');
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

  getFieldError(controlName: ProfileFieldName): string {
    const errors = this.profileForm.get(controlName)?.errors;
    const field = PROFILE_FIELDS[controlName];

    if (errors?.['required']) {
      return `${field.label} là bắt buộc.`;
    }

    if (errors?.['maxlength']) {
      return `${field.label} tối đa ${field.max} ký tự.`;
    }

    if (errors?.['personName']) { return FULL_NAME_MESSAGE; }
    if (errors?.['phoneNumber']) { return PHONE_MESSAGE; }

    return '';
  }

  getNewPasswordError(): string {
    return passwordErrorMessage(this.passwordForm.get('newPassword'));
  }

  isInvalid(formName: 'profile' | 'password', controlName: string): boolean {
    const form = formName === 'profile' ? this.profileForm : this.passwordForm;

    const control = form.get(controlName);

    return !!control && control.invalid && (control.touched || control.dirty);
  }

  onAvatarUploaded(imageUrl: string): void {
    this.profileForm.patchValue({
      avatarUrl: imageUrl,
    });
  }
}
