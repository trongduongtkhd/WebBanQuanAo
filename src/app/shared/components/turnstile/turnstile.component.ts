import {
  Component,
  ElementRef,
  EventEmitter,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';

import { environment } from '../../../../environments/environment';

// render=explicit: script không tự quét trang, component tự gọi turnstile.render() khi cần.
const TURNSTILE_SCRIPT_URL =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Khai báo tối thiểu phần API Turnstile đang dùng (không cài thư viện npm).
interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
  'timeout-callback': () => void;
}

interface TurnstileApi {
  render(container: HTMLElement, options: TurnstileRenderOptions): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// Dùng chung cho mọi instance: script chỉ được chèn vào trang MỘT lần.
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstileScript(): Promise<TurnstileApi> {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }

  if (!scriptPromise) {
    scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;

      const fail = () => {
        // Cho phép lần mở trang sau thử tải lại.
        scriptPromise = null;
        script.remove();
        reject(new Error('Không tải được script Cloudflare Turnstile.'));
      };

      script.onload = () =>
        window.turnstile ? resolve(window.turnstile) : fail();
      script.onerror = fail;

      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

/**
 * Widget Cloudflare Turnstile. Token chỉ dùng được MỘT lần và hết hạn sau ~5 phút:
 * component cha phải gọi reset() sau mỗi lần submit thất bại để lấy token mới.
 */
@Component({
  selector: 'app-turnstile',
  templateUrl: './turnstile.component.html',
  styleUrls: ['./turnstile.component.scss'],
})
export class TurnstileComponent implements OnInit, OnDestroy {
  // Phát token khi giải xong; phát '' khi token hết hạn, lỗi, hoặc bị reset.
  @Output() tokenChange = new EventEmitter<string>();

  @ViewChild('container', { static: true })
  private readonly container!: ElementRef<HTMLDivElement>;

  errorMessage = '';

  private widgetId: string | null = null;
  private destroyed = false;

  constructor(private readonly ngZone: NgZone) {}

  ngOnInit(): void {
    const siteKey = environment.turnstileSiteKey;

    if (!siteKey) {
      this.errorMessage =
        'Chưa cấu hình CAPTCHA (turnstileSiteKey). Vui lòng liên hệ quản trị viên.';
      return;
    }

    loadTurnstileScript()
      .then((turnstile) => {
        // Người dùng đã rời trang trước khi script tải xong.
        if (this.destroyed) {
          return;
        }

        // Render ngoài Angular zone: timer/animation của widget không kích hoạt change detection liên tục.
        this.ngZone.runOutsideAngular(() => {
          this.widgetId = turnstile.render(this.container.nativeElement, {
            sitekey: siteKey,
            callback: (token) => this.emit(token),
            'expired-callback': () => this.emit(''),
            'error-callback': () => this.emit(''),
            'timeout-callback': () => this.emit(''),
          });
        });
      })
      .catch(() => {
        this.errorMessage =
          'Không tải được CAPTCHA. Vui lòng kiểm tra kết nối mạng và tải lại trang.';
      });
  }

  ngOnDestroy(): void {
    this.destroyed = true;

    if (this.widgetId && window.turnstile) {
      window.turnstile.remove(this.widgetId);
    }

    this.widgetId = null;
  }

  // Bỏ token cũ (đã bị server tiêu hoặc hết hạn) và cho người dùng xác minh lại.
  reset(): void {
    if (this.widgetId && window.turnstile) {
      window.turnstile.reset(this.widgetId);
    }

    this.tokenChange.emit('');
  }

  // Callback của Turnstile chạy ngoài zone: quay lại zone để form cha cập nhật trạng thái nút.
  private emit(token: string): void {
    this.ngZone.run(() => this.tokenChange.emit(token));
  }
}
