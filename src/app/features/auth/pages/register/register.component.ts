import { HttpErrorResponse } from '@angular/common/http';
import { Component, ViewChild } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../../core/services/auth.service';
import { TurnstileComponent } from '../../../../shared/components/turnstile/turnstile.component';
import {
  accountEmailValidator, FULL_NAME_MESSAGE, normalizeEmail, normalizeFullName,
  normalizePhone, PASSWORD_RULES, personNameValidator, PHONE_MESSAGE,
  strongPasswordValidator, vietnameseMobileValidator,
} from '../../../../core/utils/account-validation.util';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  isSubmitting = false;
  errorMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  // Token CAPTCHA (Turnstile), dùng một lần: đăng ký thất bại phải reset widget.
  captchaToken = '';

  @ViewChild(TurnstileComponent) private turnstile?: TurnstileComponent;

  readonly passwordRules = PASSWORD_RULES;
  readonly fullNameMessage = FULL_NAME_MESSAGE;
  readonly phoneMessage = PHONE_MESSAGE;

  readonly registerForm = this.formBuilder.group(
    {
      fullName: ['', [Validators.required, personNameValidator]],
      email: ['', [Validators.required, accountEmailValidator]],
      phoneNumber: ['', [vietnameseMobileValidator]],
      password: ['', [Validators.required, strongPasswordValidator]],
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
  ) {}

  get fullName() {
    return this.registerForm.get('fullName');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get phoneNumber() {
    return this.registerForm.get('phoneNumber');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  submit(): void {
    if (this.isSubmitting) { return; }
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    if (!this.captchaToken) {
      this.errorMessage = 'Vui lòng hoàn tất xác minh CAPTCHA.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const value = this.registerForm.value;

    this.authService
      .register({
        fullName: normalizeFullName(value.fullName ?? ''),
        email: normalizeEmail(value.email ?? ''),
        phoneNumber: normalizePhone(value.phoneNumber),
        password: value.password ?? '',
        confirmPassword: value.confirmPassword ?? '',
        captchaToken: this.captchaToken,
      })
      .subscribe({
        next: () => this.router.navigate(['/']),
        error: (error: HttpErrorResponse) => {
          // Lỗi validate của ASP.NET trả về dạng { errors: { Field: [msg] } }.
          const validationErrors = error.error?.errors
            ? Object.values(error.error.errors as Record<string, string[]>)
                .reduce((all, messages) => all.concat(messages), [])
            : [];
          this.errorMessage =
            error.error?.message ||
            validationErrors[0] ||
            'Đăng ký thất bại. Vui lòng thử lại.';
          this.isSubmitting = false;
          // Token đã bị server tiêu (kể cả khi lỗi do email trùng...): lấy token mới cho lần thử sau.
          this.resetCaptcha();
        },
      });
  }

  private resetCaptcha(): void {
    this.captchaToken = '';
    this.turnstile?.reset();
  }

  private passwordMatchValidator(
    control: AbstractControl,
  ): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }
}
