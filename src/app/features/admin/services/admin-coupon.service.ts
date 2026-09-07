import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  Coupon,
  CouponUsage,
  UpsertCouponRequest,
} from '../../../core/models/coupon.model';
import { PagedResult } from '../../../core/models/catalog.model';

@Injectable({
  providedIn: 'root',
})
export class AdminCouponService {
  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get<ApiResponse<Coupon[]>>(
      `${environment.apiUrl}/admin/coupons`,
    );
  }

  getById(couponId: number) {
    return this.http.get<ApiResponse<Coupon>>(
      `${environment.apiUrl}/admin/coupons/${couponId}`,
    );
  }

  create(request: UpsertCouponRequest) {
    return this.http.post<ApiResponse<Coupon>>(
      `${environment.apiUrl}/admin/coupons`,
      request,
    );
  }

  update(couponId: number, request: UpsertCouponRequest) {
    return this.http.put<ApiResponse<Coupon>>(
      `${environment.apiUrl}/admin/coupons/${couponId}`,
      request,
    );
  }

  updateStatus(couponId: number, isActive: boolean) {
    return this.http.put<ApiResponse<unknown>>(
      `${environment.apiUrl}/admin/coupons/${couponId}/status`,
      { isActive },
    );
  }

  getUsages(couponId: number, page = 1, pageSize = 10) {
    const params = new HttpParams().set('page', page).set('pageSize', pageSize);

    return this.http.get<ApiResponse<PagedResult<CouponUsage>>>(
      `${environment.apiUrl}/admin/coupons/${couponId}/usages`,
      { params },
    );
  }
}
