import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PagedResult } from '../../../core/models/catalog.model';
import {
  CreatePurchaseOrderRequest,
  PurchaseOrderDetail,
  PurchaseOrderListItem,
} from '../../../core/models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminPurchaseOrderService {
  private readonly apiUrl = `${environment.apiUrl}/admin/purchase-orders`;

  constructor(private readonly http: HttpClient) {}

  getAll(
    supplierId?: number | null,
    page = 1,
    pageSize = 20,
  ): Observable<ApiResponse<PagedResult<PurchaseOrderListItem>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (supplierId) {
      params = params.set('supplierId', supplierId.toString());
    }

    return this.http.get<ApiResponse<PagedResult<PurchaseOrderListItem>>>(
      this.apiUrl,
      { params },
    );
  }

  getById(
    purchaseOrderId: number,
  ): Observable<ApiResponse<PurchaseOrderDetail>> {
    return this.http.get<ApiResponse<PurchaseOrderDetail>>(
      `${this.apiUrl}/${purchaseOrderId}`,
    );
  }

  create(
    payload: CreatePurchaseOrderRequest,
  ): Observable<ApiResponse<PurchaseOrderDetail>> {
    return this.http.post<ApiResponse<PurchaseOrderDetail>>(
      this.apiUrl,
      payload,
    );
  }

  update(
    purchaseOrderId: number,
    payload: CreatePurchaseOrderRequest,
  ): Observable<ApiResponse<PurchaseOrderDetail>> {
    return this.http.put<ApiResponse<PurchaseOrderDetail>>(
      `${this.apiUrl}/${purchaseOrderId}`,
      payload,
    );
  }

  cancel(
    purchaseOrderId: number,
    reason: string,
  ): Observable<ApiResponse<PurchaseOrderDetail>> {
    return this.http.post<ApiResponse<PurchaseOrderDetail>>(
      `${this.apiUrl}/${purchaseOrderId}/cancel`,
      { reason },
    );
  }
}
