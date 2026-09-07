import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PagedResult } from '../../../core/models/catalog.model';
import { AdminUser } from '../../../core/models/admin-user.model';

@Injectable({
  providedIn: 'root',
})
export class AdminUserService {
  constructor(private http: HttpClient) {}

  getAll(query: {
    keyword?: string;
    role?: string;
    isActive?: boolean;
    page: number;
    pageSize: number;
  }) {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize);

    if (query.keyword?.trim()) {
      params = params.set('keyword', query.keyword.trim());
    }

    if (query.role) {
      params = params.set('role', query.role);
    }

    if (query.isActive !== undefined) {
      params = params.set('isActive', query.isActive);
    }

    return this.http.get<ApiResponse<PagedResult<AdminUser>>>(
      `${environment.apiUrl}/admin/users`,
      { params },
    );
  }

  updateStatus(userId: number, isActive: boolean) {
    return this.http.put<ApiResponse<unknown>>(
      `${environment.apiUrl}/admin/users/${userId}/status`,
      { isActive },
    );
  }

  getById(userId: number) {
    return this.http.get<ApiResponse<AdminUser>>(
      `${environment.apiUrl}/admin/users/${userId}`,
    );
  }
}
