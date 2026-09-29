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

import { AuthService } from '../services/auth.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401 && !request.url.includes('/auth/login')) {
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }

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
