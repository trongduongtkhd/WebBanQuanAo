import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private readonly router: Router) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // 401 do AuthInterceptor xử lý (thử refresh token, thất bại mới về trang đăng nhập).
        // Interceptor này nằm "trong" AuthInterceptor nên thấy lỗi trước; nếu logout ở đây sẽ mất cơ hội refresh.

        if (error.status === 403) {
          this.router.navigate(['/403']);
        }

        // Lưu ý: dự án dùng RxJS 6.x — throwError() ở bản này CHỈ nhận giá trị
        // lỗi trực tiếp, KHÔNG hỗ trợ cú pháp factory function throwError(() => error)
        // của RxJS 7 (nếu viết vậy, cả hàm sẽ bị coi là "lỗi" thay vì error thật).
        return throwError(error);
      }),
    );
  }
}
