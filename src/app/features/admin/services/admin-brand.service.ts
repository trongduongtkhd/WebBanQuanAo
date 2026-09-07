import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AdminBrand,
  UpsertBrandRequest,
} from '../../../core/models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminBrandService {
  private readonly apiUrl = `${environment.apiUrl}/admin/brands`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<AdminBrand[]>> {
    return this.http.get<ApiResponse<AdminBrand[]>>(this.apiUrl);
  }

  create(payload: UpsertBrandRequest): Observable<ApiResponse<AdminBrand>> {
    return this.http.post<ApiResponse<AdminBrand>>(this.apiUrl, payload);
  }

  update(
    brandId: number,
    payload: UpsertBrandRequest,
  ): Observable<ApiResponse<AdminBrand>> {
    return this.http.put<ApiResponse<AdminBrand>>(
      `${this.apiUrl}/${brandId}`,
      payload,
    );
  }

  delete(brandId: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${brandId}`);
  }
}
