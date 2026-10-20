import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { ApiResponse } from '../../../../core/models/api-response.model';
import {
  AuthResponse,
  isTwoFactorChallenge,
  TwoFactorChallenge,
  TwoFactorFailureReason,
} from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import { TurnstileComponent } from '../../../../shared/components/turnstile/turnstile.component';

type LoginStep = 'credentials' | 'totp' | 'recovery';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit, OnDestroy {
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  step: LoginStep = 'credentials';
  challengeMinutes = 0;

  // Token CAPTCHA chỉ có ở bước 'credentials'. Widget nằm trong *ngIf của form bước 1 nên
  // tự bị huỷ khi sang bước 2 và render lại (token mới) khi quay về.
  captchaToken = '';

  @ViewChild(TurnstileComponent) private turnstile?: TurnstileComponent;

  // Challenge chỉ nằm trong bộ nhớ component (không lưu localStorage/sessionStorage).
  private challenge: TwoFactorChallenge | null = null;
  private challengeTimer: ReturnType<typeof setTimeout> | null = null;

  readonly loginForm = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  readonly codeForm = this.formBuilder.group({
    code: ['', [Validators.required]],
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('resetSuccess')) {
      this.successMessage =
        'Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.';
    }

    if (this.route.snapshot.queryParamMap.get('passwordChanged')) {
      this.successMessage =
        'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.';
    }

    if (this.route.snapshot.queryParamMap.get('twoFactorEnabled')) {
      this.successMessage =
        'Đã bật xác thực hai lớp. Vui lòng đăng nhập lại bằng mật khẩu và mã từ ứng dụng xác thực.';
    }
  }

  ngOnDestroy(): void {
    this.clearChallenge();
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get code() {
    return this.codeForm.get('code');
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    if (!this.captchaToken) {
      this.errorMessage = 'Vui lòng hoàn tất xác minh CAPTCHA.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const payload = {
      email: this.email?.value?.trim() ?? '',
      password: this.password?.value ?? '',
      captchaToken: this.captchaToken,
    };

    this.authService.login(payload).subscribe({
      next: (response) => {
        if (isTwoFactorChallenge(response.data)) {
          // Mật khẩu đúng nhưng tài khoản bật 2FA: chưa có phiên, chuyển sang bước nhập mã.
          this.startTwoFactor(response.data);
          this.isSubmitting = false;
          return;
        }

        this.navigateAfterLogin();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.error?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
        this.isSubmitting = false;
        // Token đã bị server tiêu (kể cả khi sai mật khẩu): không reset thì lần thử sau dính timeout-or-duplicate.
        this.resetCaptcha();
      },
    });
  }

  submitCode(): void {
    const value = (this.code?.value ?? '').trim();

    if (!this.challenge) {
      this.backToCredentials(
        'Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.',
      );
      return;
    }

    if (this.step === 'totp' && !/^\d{6}$/.test(value)) {
      this.errorMessage = 'Vui lòng nhập đủ 6 chữ số.';
      return;
    }

    if (this.step === 'recovery' && !value) {
      this.errorMessage = 'Vui lòng nhập mã khôi phục.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const token = this.challenge.twoFactorToken;
    const request$: Observable<ApiResponse<AuthResponse>> =
      this.step === 'totp'
        ? this.authService.verifyTwoFactor({ twoFactorToken: token, code: value })
        : this.authService.verifyRecoveryCode({
            twoFactorToken: token,
            recoveryCode: value,
          });

    request$.subscribe({
      next: () => {
        this.clearChallenge();
        this.navigateAfterLogin();
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting = false;

        const message =
          error.error?.message || 'Xác thực thất bại. Vui lòng thử lại.';
        const reason = error.error?.data?.reason as
          | TwoFactorFailureReason
          | undefined;

        // Challenge hết hạn/hết lượt hoặc tài khoản bị khóa: challenge này không dùng được nữa.
        if (
          error.status === 401 &&
          (reason === 'ChallengeExpired' || reason === 'LockedOut')
        ) {
          this.backToCredentials(message);
          return;
        }

        this.errorMessage = message;
        this.code?.reset('');
      },
    });
  }

  // Mã TOTP chỉ gồm chữ số: loại bỏ ký tự khác ngay khi gõ/dán.
  onTotpInput(): void {
    const digits = (this.code?.value ?? '').replace(/\D/g, '').slice(0, 6);

    if (digits !== this.code?.value) {
      this.code?.setValue(digits);
    }
  }

  switchStep(step: 'totp' | 'recovery'): void {
    this.step = step;
    this.errorMessage = '';
    this.code?.reset('');
  }

  backToCredentials(message = ''): void {
    this.clearChallenge();
    // Widget bước 1 sẽ được render mới => chờ token mới, không dùng lại token đã tiêu.
    this.captchaToken = '';
    this.step = 'credentials';
    this.errorMessage = message;
    this.successMessage = '';
    this.isSubmitting = false;
    this.code?.reset('');
    this.password?.reset('');
  }

  private startTwoFactor(challenge: TwoFactorChallenge): void {
    this.clearChallenge();

    this.challenge = challenge;
    // Token CAPTCHA đã được dùng ở bước 1.
    this.captchaToken = '';
    this.challengeMinutes = Math.round(challenge.expiresInSeconds / 60);
    this.step = 'totp';
    this.successMessage = '';
    this.errorMessage = '';
    this.code?.reset('');

    // Đếm theo expiresInSeconds do server trả (không phụ thuộc lệch đồng hồ máy khách).
    this.challengeTimer = setTimeout(
      () =>
        this.backToCredentials(
          'Phiên xác thực đã hết hạn. Vui lòng đăng nhập lại.',
        ),
      challenge.expiresInSeconds * 1000,
    );
  }

  private resetCaptcha(): void {
    this.captchaToken = '';
    this.turnstile?.reset();
  }

  private clearChallenge(): void {
    if (this.challengeTimer) {
      clearTimeout(this.challengeTimer);
      this.challengeTimer = null;
    }

    this.challenge = null;
  }

  private navigateAfterLogin(): void {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/';

    this.router.navigateByUrl(returnUrl);
  }
}
