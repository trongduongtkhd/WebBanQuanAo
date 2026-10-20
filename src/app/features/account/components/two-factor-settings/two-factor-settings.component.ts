import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { TwoFactorSetup } from '../../../../core/models/two-factor.model';
import { AuthService } from '../../../../core/services/auth.service';
import { TokenService } from '../../../../core/services/token.service';
import { TwoFactorService } from '../../../../core/services/two-factor.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';

type TwoFactorMode = 'idle' | 'setup' | 'codes' | 'disable';

const RECOVERY_FILE_NAME = 'recovery-codes-ClothingStore.txt';

@Component({
  selector: 'app-two-factor-settings',
  templateUrl: './two-factor-settings.component.html',
  styleUrls: ['./two-factor-settings.component.scss'],
})
export class TwoFactorSettingsComponent {
  @Input() enabled = false;
  @Output() enabledChange = new EventEmitter<boolean>();

  mode: TwoFactorMode = 'idle';
  loading = false;
  errorMessage = '';
  successMessage = '';
  copyMessage = '';

  // Secret/QR chỉ giữ trong bộ nhớ lúc đang thiết lập; mã khôi phục chỉ giữ tới khi người dùng xác nhận đã lưu.
  setup: TwoFactorSetup | null = null;
  recoveryCodes: string[] = [];
  useRecoveryCode = false;

  readonly enableForm = this.fb.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  readonly disableForm = this.fb.group({
    password: ['', Validators.required],
    code: ['', Validators.required],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly twoFactorService: TwoFactorService,
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
    private readonly router: Router,
  ) {}

  // Mã khôi phục chỉ hiện MỘT lần: trình duyệt hỏi lại nếu người dùng F5 / đóng tab khi chưa xác nhận đã lưu.
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.mode === 'codes') {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  startSetup(): void {
    this.resetMessages();
    this.loading = true;

    this.twoFactorService.setup().subscribe({
      next: (response) => {
        this.loading = false;
        this.setup = response.data;
        this.enableForm.reset({ code: '' });
        this.mode = 'setup';
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = getApiErrorMessage(
          error,
          'Không thể bắt đầu thiết lập xác thực hai lớp.',
        );
      },
    });
  }

  confirmEnable(): void {
    this.resetMessages();

    if (this.enableForm.invalid) {
      this.enableForm.markAllAsTouched();
      this.errorMessage = 'Vui lòng nhập đủ 6 chữ số từ ứng dụng xác thực.';
      return;
    }

    this.loading = true;

    this.twoFactorService.enable(this.enableForm.value.code).subscribe({
      next: (response) => {
        this.loading = false;
        this.setup = null;
        this.recoveryCodes = response.data.recoveryCodes;
        this.mode = 'codes';
        this.updateStatus(true);

        // Server đã thu hồi mọi phiên (kể cả thiết bị này): chỉ cần F5 hoặc access token hết hạn là màn hình
        // này mất vĩnh viễn => tự động tải file ngay khi nhận được mã.
        this.downloadRecoveryCodes();
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = getApiErrorMessage(
          error,
          'Không thể bật xác thực hai lớp.',
        );
      },
    });
  }

  // Phiên hiện tại đã bị thu hồi khi bật 2FA => đăng nhập lại (lần này qua đủ 2 lớp).
  finishEnable(): void {
    this.recoveryCodes = [];
    this.mode = 'idle';
    this.authService.clearSession();
    this.router.navigate(['/auth/login'], {
      queryParams: { twoFactorEnabled: 1 },
    });
  }

  startDisable(): void {
    this.resetMessages();
    this.useRecoveryCode = false;
    this.disableForm.reset({ password: '', code: '' });
    this.mode = 'disable';
  }

  toggleRecoveryCode(): void {
    this.useRecoveryCode = !this.useRecoveryCode;
    this.disableForm.get('code')?.reset('');
  }

  confirmDisable(): void {
    this.resetMessages();

    if (this.disableForm.invalid) {
      this.disableForm.markAllAsTouched();
      this.errorMessage = 'Vui lòng nhập mật khẩu và mã xác thực.';
      return;
    }

    const value = this.disableForm.value;
    const code = (value.code as string).trim();

    this.loading = true;

    this.twoFactorService
      .disable({
        password: value.password,
        code: this.useRecoveryCode ? null : code,
        recoveryCode: this.useRecoveryCode ? code : null,
      })
      .subscribe({
        next: (response) => {
          this.loading = false;
          this.mode = 'idle';
          this.disableForm.reset({ password: '', code: '' });
          this.successMessage = response.message;
          this.updateStatus(false);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = getApiErrorMessage(
            error,
            'Không thể tắt xác thực hai lớp.',
          );
        },
      });
  }

  cancel(): void {
    this.resetMessages();
    this.setup = null;
    this.mode = 'idle';
  }

  copyRecoveryCodes(): void {
    const text = this.recoveryCodes.join('\n');
    const done = () => (this.copyMessage = 'Đã sao chép mã khôi phục.');

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(done)
        .catch(() => this.copyWithTextarea(text, done));
    } else {
      this.copyWithTextarea(text, done);
    }
  }

  downloadRecoveryCodes(): void {
    const lines = [
      'Mã khôi phục xác thực hai lớp - ClothingStore',
      `Tài khoản: ${this.authService.currentUser?.email ?? ''}`,
      `Tạo lúc: ${new Date().toLocaleString('vi-VN')}`,
      'Mỗi mã chỉ dùng được MỘT lần. Cất giữ ở nơi an toàn, không chia sẻ cho ai.',
      '',
      ...this.recoveryCodes,
      '',
    ];

    const blob = new Blob([lines.join('\r\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = RECOVERY_FILE_NAME;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  private copyWithTextarea(text: string, done: () => void): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      if (document.execCommand('copy')) {
        done();
      } else {
        this.copyMessage = 'Không sao chép được, hãy chọn và sao chép thủ công.';
      }
    } finally {
      document.body.removeChild(textarea);
    }
  }

  private updateStatus(enabled: boolean): void {
    this.enabled = enabled;
    this.enabledChange.emit(enabled);

    const user = this.authService.currentUser;

    if (user) {
      const updated = { ...user, twoFactorEnabled: enabled };
      this.tokenService.setUser(updated);
      this.authService.updateCurrentUser(updated);
    }
  }

  private resetMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.copyMessage = '';
  }
}
