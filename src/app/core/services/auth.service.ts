import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, timer } from 'rxjs';
import { catchError, finalize, mapTo, switchMap, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  AuthResponse,
  ForgotPasswordRequest,
  isTwoFactorChallenge,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
  TwoFactorRecoveryRequest,
  TwoFactorVerifyRequest,
} from '../models/auth.model';
import { CurrentUser } from '../models/user.model';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(
    this.tokenService.getUser(),
  );

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService,
  ) {}

  get currentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  // Các request tới /auth/* được AuthInterceptor gắn withCredentials để trình duyệt gửi/nhận cookie refresh token.
  // Tài khoản bật 2FA: phản hồi là TwoFactorChallenge (chưa có token) => KHÔNG tạo phiên, nơi gọi chuyển sang bước nhập mã.
  // payload.captchaToken (Turnstile) bắt buộc với login/register; server kiểm tra trước cả mật khẩu.
  login(payload: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    return this.http
      .post<ApiResponse<LoginResponse>>(`${this.apiUrl}/login`, payload)
      .pipe(
        tap((response) => {
          if (!isTwoFactorChallenge(response.data)) {
            this.handleAuthResponse(response as ApiResponse<AuthResponse>);
          }
        }),
      );
  }

  // Đăng nhập bước 2 bằng mã 6 số từ ứng dụng xác thực. Thành công thì server mới cấp access token + cookie refresh.
  verifyTwoFactor(
    payload: TwoFactorVerifyRequest,
  ): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(
        `${this.apiUrl}/two-factor/verify`,
        payload,
      )
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  // Đăng nhập bước 2 bằng mã khôi phục (mỗi mã dùng một lần).
  verifyRecoveryCode(
    payload: TwoFactorRecoveryRequest,
  ): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(
        `${this.apiUrl}/two-factor/recovery`,
        payload,
      )
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  register(payload: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, payload)
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  // Server đọc refresh token từ cookie HttpOnly, xoay vòng và trả access token mới.
  refresh(): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/refresh`, {})
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  // Refresh, nếu bị 401 thì chờ ~500ms rồi thử lại ĐÚNG 1 lần: tab khác có thể vừa xoay token
  // (request này gửi cookie cũ), sau 500ms trình duyệt đã nhận cookie mới. Hàm này KHÔNG xoá phiên,
  // lỗi cuối cùng được trả cho nơi gọi tự quyết định (dùng chung cho restoreSession và AuthInterceptor).
  refreshWithRetry(): Observable<ApiResponse<AuthResponse>> {
    return this.refresh().pipe(
      catchError((error: HttpErrorResponse) =>
        error.status === 401
          ? timer(500).pipe(switchMap(() => this.refresh()))
          : throwError(error),
      ),
    );
  }

  // Gọi trong APP_INITIALIZER: khôi phục access token (nằm trong bộ nhớ nên mất khi F5)
  // TRƯỚC khi router chạy guard. Luôn resolve để app vẫn khởi động khi refresh thất bại.
  restoreSession(): Promise<void> {
    // Chưa từng đăng nhập trên trình duyệt này => không cần gọi API.
    if (!this.tokenService.getUser()) {
      return Promise.resolve();
    }

    return this.refreshWithRetry()
      .pipe(
        mapTo(undefined),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401) {
            // Đã thử lại mà vẫn 401 => phiên thật sự không còn.
            this.clearSession();
          } else {
            // Lỗi mạng / 5xx: GIỮ gợi ý user trong localStorage (dùng chung giữa các tab, F5 sau thử lại),
            // chỉ bỏ user trong bộ nhớ vì app chưa có access token.
            this.currentUserSubject.next(null);
          }
          return of(undefined);
        }),
      )
      .toPromise();
  }

  forgotPassword(
    payload: ForgotPasswordRequest,
  ): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.apiUrl}/forgot-password`,
      payload,
    );
  }

  resetPassword(payload: ResetPasswordRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(
      `${this.apiUrl}/reset-password`,
      payload,
    );
  }

  getMe(): Observable<ApiResponse<CurrentUser>> {
    return this.http.get<ApiResponse<CurrentUser>>(`${this.apiUrl}/me`).pipe(
      tap((response) => {
        if (response.success && this.tokenService.getToken()) {
          this.tokenService.setUser(response.data);
          this.currentUserSubject.next(response.data);
        }
      }),
    );
  }

  // Thu hồi refresh token ở server (và xoá cookie) rồi mới xoá trạng thái local.
  // Lỗi mạng vẫn xoá local để người dùng không bị kẹt ở trạng thái đăng nhập.
  logout(): Observable<void> {
    return this.http.post<unknown>(`${this.apiUrl}/logout`, {}).pipe(
      mapTo(undefined),
      catchError(() => of(undefined)),
      finalize(() => this.clearSession()),
    );
  }

  // Chỉ xoá trạng thái phía trình duyệt (dùng khi server đã từ chối phiên, ví dụ refresh thất bại).
  clearSession(): void {
    this.tokenService.clearSession();
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getToken();
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  private handleAuthResponse(response: ApiResponse<AuthResponse>): void {
    // Phòng thủ thêm một lớp: không có access token (ví dụ phản hồi challenge 2FA) thì không tạo phiên.
    if (
      !response.success ||
      isTwoFactorChallenge(response.data) ||
      !response.data?.accessToken
    ) {
      return;
    }

    this.tokenService.setSession(response.data.accessToken, response.data.user);

    this.currentUserSubject.next(response.data.user);
  }

  updateCurrentUser(user: CurrentUser): void {
    this.currentUserSubject.next(user);
  }
}
