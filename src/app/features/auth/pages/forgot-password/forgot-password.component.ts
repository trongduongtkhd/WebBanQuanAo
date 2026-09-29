import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss'],
})
export class ForgotPasswordComponent {
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  readonly forgotPasswordForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
  ) {}

  get email() {
    return this.forgotPasswordForm.get('email');
  }

  submit(): void {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const email = this.email?.value?.trim() ?? '';

    this.authService.forgotPassword({ email }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.successMessage =
          response.message ||
          'Nếu email tồn tại trong hệ thống, chúng tôi đã gửi hướng dẫn đặt lại mật khẩu.';
        this.forgotPasswordForm.reset();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      },
    });
  }
}
