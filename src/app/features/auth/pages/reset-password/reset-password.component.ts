import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { passwordErrorMessage, strongPasswordValidator } from '../../../../core/utils/account-validation.util';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
  isSubmitting = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;
  token = '';
  tokenMissing = false;

  readonly resetPasswordForm = this.formBuilder.group(
    {
      newPassword: ['', [Validators.required, strongPasswordValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [this.passwordMatchValidator],
    },
  );

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    this.tokenMissing = !this.token;
  }

  get newPassword() {
    return this.resetPasswordForm.get('newPassword');
  }

  get confirmPassword() {
    return this.resetPasswordForm.get('confirmPassword');
  }

  get newPasswordError(): string {
    return passwordErrorMessage(this.newPassword);
  }

  submit(): void {
    if (this.isSubmitting) { return; }
    if (this.tokenMissing || this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const value = this.resetPasswordForm.value;

    this.authService
      .resetPassword({
        token: this.token,
        newPassword: value.newPassword ?? '',
        confirmPassword: value.confirmPassword ?? '',
      })
      .subscribe({
        next: () => {
          this.router.navigate(['/auth/login'], {
            queryParams: { resetSuccess: 1 },
          });
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting = false;
          this.errorMessage = getApiErrorMessage(error, 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
        },
      });
  }

  private passwordMatchValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const newPassword = control.get('newPassword')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }
}
