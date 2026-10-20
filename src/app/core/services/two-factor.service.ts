import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  DisableTwoFactorRequest,
  EnableTwoFactorResponse,
  TwoFactorSetup,
} from '../models/two-factor.model';

// Quản lý 2FA của người dùng đang đăng nhập (cần access token). Sai mã/mật khẩu trả 400,
// nên 401 ở các endpoint này chỉ có nghĩa access token hết hạn => AuthInterceptor refresh bình thường.
@Injectable({
  providedIn: 'root',
})
export class TwoFactorService {
  private readonly apiUrl = `${environment.apiUrl}/users/two-factor`;

  constructor(private readonly http: HttpClient) {}

  setup(): Observable<ApiResponse<TwoFactorSetup>> {
    return this.http.post<ApiResponse<TwoFactorSetup>>(
      `${this.apiUrl}/setup`,
      {},
    );
  }

  enable(code: string): Observable<ApiResponse<EnableTwoFactorResponse>> {
    return this.http.post<ApiResponse<EnableTwoFactorResponse>>(
      `${this.apiUrl}/enable`,
      { code },
    );
  }

  disable(request: DisableTwoFactorRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.apiUrl}/disable`, request);
  }
}
