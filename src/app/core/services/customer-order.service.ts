import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { PagedResult } from '../models/catalog.model';
import {
  CancelOrderRequest,
  MockQr,
  OrderDetail,
  OrderSummary,
  Payment,
} from '../models/order.model';

@Injectable({
  providedIn: 'root',
})
export class CustomerOrderService {
  constructor(private http: HttpClient) {}

  getMyOrders(status?: number, page = 1, pageSize = 10) {
    let params = new HttpParams().set('page', page).set('pageSize', pageSize);

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ApiResponse<PagedResult<OrderSummary>>>(
      `${environment.apiUrl}/orders/my-orders`,
      { params },
    );
  }

  getById(orderId: number) {
    return this.http.get<ApiResponse<OrderDetail>>(
      `${environment.apiUrl}/orders/${orderId}`,
    );
  }

  cancel(orderId: number, request: CancelOrderRequest) {
    return this.http.put<ApiResponse<unknown>>(
      `${environment.apiUrl}/orders/${orderId}/cancel`,
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
