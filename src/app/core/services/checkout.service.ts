import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  Address,
  BuyNowItem,
  CouponValidation,
  CreateOrderRequest,
  MockQr,
  OrderDetail,
  Payment,
} from '../models/checkout.model';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  constructor(private http: HttpClient) {}

  getMyAddresses() {
    return this.http.get<ApiResponse<Address[]>>(
      `${environment.apiUrl}/addresses`,
    );
  }

  validateCoupon(code: string, buyNowItem?: BuyNowItem | null) {
    return this.http.post<ApiResponse<CouponValidation>>(
      `${environment.apiUrl}/coupons/validate`,
      { code, buyNowItem: buyNowItem || null },
    );
  }

  createOrder(request: CreateOrderRequest) {
    return this.http.post<ApiResponse<OrderDetail>>(
      `${environment.apiUrl}/orders`,
      request,
    );
  }

  getMockQr(orderId: number) {
    return this.http.get<ApiResponse<MockQr>>(
      `${environment.apiUrl}/orders/${orderId}/mock-qr`,
    );
  }

  confirmMockQr(orderId: number) {
    return this.http.post<ApiResponse<Payment>>(
      `${environment.apiUrl}/orders/${orderId}/mock-qr/confirm`,
      {},
    );
  }
}
