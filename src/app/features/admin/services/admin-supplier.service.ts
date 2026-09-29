import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AdminSupplier,
  UpsertSupplierRequest,
} from '../../../core/models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminSupplierService {
  private readonly apiUrl = `${environment.apiUrl}/admin/suppliers`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<AdminSupplier[]>> {
    return this.http.get<ApiResponse<AdminSupplier[]>>(this.apiUrl);
  }

  create(
    payload: UpsertSupplierRequest,
  ): Observable<ApiResponse<AdminSupplier>> {
    return this.http.post<ApiResponse<AdminSupplier>>(this.apiUrl, payload);
  }

  update(
    supplierId: number,
    payload: UpsertSupplierRequest,
  ): Observable<ApiResponse<AdminSupplier>> {
    return this.http.put<ApiResponse<AdminSupplier>>(
      `${this.apiUrl}/${supplierId}`,
      payload,
    );
  }

  delete(supplierId: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(
      `${this.apiUrl}/${supplierId}`,
    );
  }
}
