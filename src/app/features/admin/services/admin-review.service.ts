import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PagedResult } from '../../../core/models/catalog.model';
import { AdminReview } from '../../../core/models/review.model';

@Injectable({
  providedIn: 'root',
})
export class AdminReviewService {
  constructor(private http: HttpClient) {}

  getAll(query: {
    keyword?: string;
    isApproved?: boolean;
    page: number;
    pageSize: number;
  }) {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize);

    if (query.keyword?.trim()) {
      params = params.set('keyword', query.keyword.trim());
    }

    if (query.isApproved !== undefined && query.isApproved !== null) {
      params = params.set('isApproved', query.isApproved);
    }

    return this.http.get<ApiResponse<PagedResult<AdminReview>>>(
      `${environment.apiUrl}/admin/reviews`,
      { params },
    );
  }

  approve(reviewId: number) {
    return this.http.put<ApiResponse<unknown>>(
      `${environment.apiUrl}/admin/reviews/${reviewId}/approve`,
      {},
    );
  }

  reject(reviewId: number) {
    return this.http.put<ApiResponse<unknown>>(
      `${environment.apiUrl}/admin/reviews/${reviewId}/reject`,
      {},
    );
  }
}
