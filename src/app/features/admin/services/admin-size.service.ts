import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { AdminSize, UpsertSizeRequest } from '../../../core/models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminSizeService {
  private readonly apiUrl = `${environment.apiUrl}/admin/sizes`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<AdminSize[]>> {
    return this.http.get<ApiResponse<AdminSize[]>>(this.apiUrl);
  }

  create(payload: UpsertSizeRequest): Observable<ApiResponse<AdminSize>> {
    return this.http.post<ApiResponse<AdminSize>>(this.apiUrl, payload);
  }

  update(
    sizeId: number,
    payload: UpsertSizeRequest,
  ): Observable<ApiResponse<AdminSize>> {
    return this.http.put<ApiResponse<AdminSize>>(
      `${this.apiUrl}/${sizeId}`,
      payload,
    );
  }

  delete(sizeId: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${sizeId}`);
  }
}
