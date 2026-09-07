import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  AdminReview,
  CreateReviewRequest,
  MyReview,
  UpdateReviewRequest,
} from '../models/review.model';
import { PagedResult } from '../models/catalog.model';
import { PublicReview } from '../models/review.model';

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  constructor(private http: HttpClient) {}

  create(request: CreateReviewRequest) {
    return this.http.post<ApiResponse<AdminReview>>(
      `${environment.apiUrl}/reviews`,
      request,
    );
  }

  getPublicByProduct(productId: number, page = 1, pageSize = 10) {
    return this.http.get<ApiResponse<PagedResult<PublicReview>>>(
      `${environment.apiUrl}/products/${productId}/reviews`,
      {
        params: {
          page: String(page),
          pageSize: String(pageSize),
        },
      },
    );
  }

  getMyReviews(page = 1, pageSize = 10) {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);

    return this.http.get<ApiResponse<PagedResult<MyReview>>>(
      `${environment.apiUrl}/reviews/my`,
      { params },
    );
  }

  update(reviewId: number, request: UpdateReviewRequest) {
    return this.http.put<ApiResponse<AdminReview>>(
      `${environment.apiUrl}/reviews/${reviewId}`,
      request,
    );
  }

  delete(reviewId: number) {
    return this.http.delete<ApiResponse<unknown>>(
      `${environment.apiUrl}/reviews/${reviewId}`,
    );
  }
}
