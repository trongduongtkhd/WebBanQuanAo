import { Injectable, Injector } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, ReplaySubject, throwError } from 'rxjs';
import { catchError, switchMap, take } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { TokenService } from '../services/token.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly authUrl = `${environment.apiUrl}/auth/`;

  // Các endpoint này trả 401 là kết quả cuối cùng (sai mật khẩu, refresh token hỏng...) => KHÔNG gọi refresh,
  // tránh vòng lặp refresh -> 401 -> refresh.
  private readonly noRefreshEndpoints = [
    'login',
    'register',
    'refresh',
    'logout',
    'forgot-password',
    'reset-password',
  ];

  // Single-flight: khi đang refresh, mọi request bị 401 cùng chờ kết quả của ĐÚNG MỘT lần gọi /auth/refresh.
  private refreshing$: ReplaySubject<string> | null = null;

  // AuthService và Router lấy qua Injector khi cần, tránh lỗi cyclic dependency
  // (AuthService -> HttpClient -> interceptor -> AuthService), nhất là khi interceptor được tạo trong APP_INITIALIZER.
  constructor(
    private readonly tokenService: TokenService,
    private readonly injector: Injector,
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    const token = this.tokenService.getToken();

    return next.handle(this.prepare(request, token)).pipe(
      catchError((error: unknown) => {
        if (
          error instanceof HttpErrorResponse &&
          error.status === 401 &&
          !this.isNoRefreshUrl(request.url)
        ) {
          return this.handle401(request, next, token);
        }

        // RxJS 6.x: throwError() nhận trực tiếp giá trị lỗi, không phải factory function.
        return throwError(error);
      }),
    );
  }

  private handle401(
    request: HttpRequest<unknown>,
    next: HttpHandler,
    failedToken: string | null,
  ): Observable<HttpEvent<unknown>> {
    // Request này được gửi bằng token cũ, nhưng trong lúc chờ phản hồi đã có lần refresh khác hoàn tất
    // => gửi lại luôn bằng token mới, không cần refresh thêm lần nữa.
    const currentToken = this.tokenService.getToken();

    if (currentToken && currentToken !== failedToken) {
      return next.handle(this.prepare(request, currentToken));
    }

    const refreshing$ = this.refreshing$ ?? this.startRefresh();

    return refreshing$.pipe(
      take(1),
      switchMap((newToken) => next.handle(this.prepare(request, newToken))),
    );
  }

  private startRefresh(): ReplaySubject<string> {
    const subject = new ReplaySubject<string>(1);
    this.refreshing$ = subject;

    const authService = this.injector.get(AuthService);

    authService.refreshWithRetry().subscribe({
      next: (response) => {
        this.refreshing$ = null;
        subject.next(response.data.accessToken);
        subject.complete();
      },
      error: (error: unknown) => {
        this.refreshing$ = null;

        // Đã thử lại mà vẫn 401: refresh token hết hạn / bị thu hồi / bị phát hiện dùng lại => buộc đăng nhập lại.
        // Lỗi mạng / 5xx: giữ nguyên phiên và không chuyển trang, chỉ trả lỗi cho các request đang chờ.
        if (error instanceof HttpErrorResponse && error.status === 401) {
          authService.clearSession();

          const router = this.injector.get(Router);
          router.navigate(['/auth/login'], {
            queryParams: { returnUrl: router.url },
          });
        }

        // Mọi request đang chờ đều nhận lỗi (không bị treo).
        subject.error(error);
      },
    });

    return subject;
  }

  private prepare(
    request: HttpRequest<unknown>,
    token: string | null,
  ): HttpRequest<unknown> {
    // Cookie refresh token có Path=/api/auth nên chỉ các request /auth/* cần gửi kèm cookie.
    // withCredentials bắt buộc khi frontend (localhost:4200) khác origin với API (localhost:8080).
    const withCredentials = request.url.startsWith(this.authUrl);

    if (!token && !withCredentials) {
      return request;
    }

    return request.clone({
      withCredentials: withCredentials || request.withCredentials,
      setHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    });
  }

  private isNoRefreshUrl(url: string): boolean {
    if (!url.startsWith(this.authUrl)) {
      return false;
    }

    const endpoint = url.substring(this.authUrl.length).split(/[?#]/)[0];

    return this.noRefreshEndpoints.includes(endpoint);
  }
}
