import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface VnpayStatus {
  orderId: number;
  orderCode: string;
  amount: number;
  paymentStatus: string;
  attemptStatus: string | null;
  transactionCode: string | null;
  paidAt: string | null;
  expiresAt: string | null;
  canPay: boolean;
  canCancel: boolean;
  requiresReview: boolean;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class VnpayService {
  constructor(private http: HttpClient) {}

  redirectToPayment(url: string): void {
    window.location.assign(url);
  }

  configuration() {
    return this.http.get<{ enabled: boolean }>(`${environment.apiUrl}/payments/vnpay/configuration`);
  }

  createPaymentUrl(orderId: number) {
    return this.http.post<ApiResponse<{ paymentUrl: string; txnRef: string; expiresAt: string }>>(
      `${environment.apiUrl}/orders/${orderId}/vnpay/payment-url`, {});
  }

  status(orderId: number, admin = false) {
    return this.http.get<ApiResponse<VnpayStatus>>(
      `${environment.apiUrl}/${admin ? 'admin/' : ''}orders/${orderId}/vnpay/status`);
  }

  reconcile(orderId: number, admin = false) {
    return this.http.post<ApiResponse<VnpayStatus>>(
      `${environment.apiUrl}/${admin ? 'admin/' : ''}orders/${orderId}/vnpay/reconcile`, {});
  }
}
