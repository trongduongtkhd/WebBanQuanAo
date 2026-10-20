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

const PASSWORD_MIN_LENGTH = 8;

/** Kiểm tra từng điều kiện mật khẩu, mỗi điều kiện sai là một key lỗi riêng. */
function strongPasswordValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) {
    return null; // để Validators.required xử lý
  }

  const firstChar = value.charAt(0);
  const errors: ValidationErrors = {};

  if (value.length < PASSWORD_MIN_LENGTH) {
    errors.minLength = true;
  }
  if (firstChar === firstChar.toLowerCase() || firstChar !== firstChar.toUpperCase()) {
    errors.firstUppercase = true;
  }
  if (!/\d/.test(value)) {
    errors.digit = true;
  }
  // Ký tự đặc biệt: không phải chữ (chữ có hoa/thường), không phải số, không phải khoảng trắng.
  const hasSpecial = value
    .split('')
    .some(
      (c) => c.toLowerCase() === c.toUpperCase() && !/[\d\s]/.test(c),
    );
  if (!hasSpecial) {
    errors.special = true;
  }

  return Object.keys(errors).length ? errors : null;
}

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

  readonly passwordRules = [
    { key: 'minLength', label: `Ít nhất ${PASSWORD_MIN_LENGTH} ký tự` },
    { key: 'firstUppercase', label: 'Ký tự đầu tiên viết hoa' },
    { key: 'digit', label: 'Có ít nhất 1 chữ số' },
    { key: 'special', label: 'Có ít nhất 1 ký tự đặc biệt (@, !, #, $...)' },
  ];

  readonly registerForm = this.formBuilder.group(
    {
      fullName: ['', [Validators.required, Validators.maxLength(150)]],
      // Validators.email chấp nhận cả "abc@gmail" (thiếu tên miền), nên bắt buộc thêm phần ".xx" ở cuối.
      email: [
        '',
        [
          Validators.required,
          Validators.email,
          Validators.pattern(/^\s*[^\s@]+@[^\s@]+\.[A-Za-z]{2,}\s*$/),
        ],
      ],
      phoneNumber: ['', [Validators.maxLength(20)]],
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

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  submit(): void {
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
        fullName: value.fullName?.trim() ?? '',
        email: value.email?.trim() ?? '',
        phoneNumber: value.phoneNumber?.trim() || null,
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
