import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PagedResult } from '../../../core/models/catalog.model';
import {
  AdminOrderSummary,
  OrderDetail,
  Payment,
  UpdateOrderStatusRequest,
  UpdatePaymentStatusRequest,
} from '../../../core/models/order.model';

@Injectable({
  providedIn: 'root',
})
export class AdminOrderService {
  constructor(private http: HttpClient) {}

  getAll(query: {
    keyword?: string;
    status?: number;
    paymentStatus?: number;
    page: number;
    pageSize: number;
  }) {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize);

    if (query.keyword?.trim()) {
      params = params.set('keyword', query.keyword.trim());
    }

    if (query.status) {
      params = params.set('status', query.status);
    }

    if (query.paymentStatus) {
      params = params.set('paymentStatus', query.paymentStatus);
    }

    return this.http.get<ApiResponse<PagedResult<AdminOrderSummary>>>(
      `${environment.apiUrl}/admin/orders`,
      { params },
    );
  }

  getById(orderId: number) {
    return this.http.get<ApiResponse<OrderDetail>>(
      `${environment.apiUrl}/admin/orders/${orderId}`,
    );
  }

  updateOrderStatus(orderId: number, request: UpdateOrderStatusRequest) {
    return this.http.put<ApiResponse<OrderDetail>>(
      `${environment.apiUrl}/admin/orders/${orderId}/status`,
      request,
    );
  }

  updatePaymentStatus(orderId: number, request: UpdatePaymentStatusRequest) {
    return this.http.put<ApiResponse<Payment>>(
      `${environment.apiUrl}/admin/orders/${orderId}/payment-status`,
      request,
    );
  }
}
