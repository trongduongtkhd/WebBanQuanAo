import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AdminColor,
  UpsertColorRequest,
} from '../../../core/models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminColorService {
  private readonly apiUrl = `${environment.apiUrl}/admin/colors`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<AdminColor[]>> {
    return this.http.get<ApiResponse<AdminColor[]>>(this.apiUrl);
  }

  create(payload: UpsertColorRequest): Observable<ApiResponse<AdminColor>> {
    return this.http.post<ApiResponse<AdminColor>>(this.apiUrl, payload);
  }

  update(
    colorId: number,
    payload: UpsertColorRequest,
  ): Observable<ApiResponse<AdminColor>> {
    return this.http.put<ApiResponse<AdminColor>>(
      `${this.apiUrl}/${colorId}`,
      payload,
    );
  }

  delete(colorId: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${colorId}`);
  }
}
