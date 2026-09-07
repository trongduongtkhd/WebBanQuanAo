import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AdminCategory,
  UpsertCategoryRequest,
} from '../../../core/models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminCategoryService {
  private readonly apiUrl = `${environment.apiUrl}/admin/categories`;

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<ApiResponse<AdminCategory[]>> {
    return this.http.get<ApiResponse<AdminCategory[]>>(this.apiUrl);
  }

  create(
    payload: UpsertCategoryRequest,
  ): Observable<ApiResponse<AdminCategory>> {
    return this.http.post<ApiResponse<AdminCategory>>(this.apiUrl, payload);
  }

  update(
    categoryId: number,
    payload: UpsertCategoryRequest,
  ): Observable<ApiResponse<AdminCategory>> {
    return this.http.put<ApiResponse<AdminCategory>>(
      `${this.apiUrl}/${categoryId}`,
      payload,
    );
  }

  delete(categoryId: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(
      `${this.apiUrl}/${categoryId}`,
    );
  }
}
