import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AvailableCoupon } from '../models/coupon.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerCouponService {
  constructor(private http: HttpClient) {}

  getAvailableCoupons() {
    return this.http.get<ApiResponse<AvailableCoupon[]>>(
      `${environment.apiUrl}/coupons/available`,
    );
  }
}
