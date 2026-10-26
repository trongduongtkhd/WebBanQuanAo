import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, timer } from 'rxjs';
import { exhaustMap, take, takeUntil } from 'rxjs/operators';
import { VnpayService, VnpayStatus } from '../../../../core/services/vnpay.service';

@Component({
  selector: 'app-vnpay-result',
  templateUrl: './vnpay-result.component.html',
  styleUrls: ['./vnpay-result.component.scss'],
})
export class VnpayResultComponent implements OnInit, OnDestroy {
  status: VnpayStatus | null = null;
  orderId = 0;
  checking = false;
  paying = false;
  error = '';
  private destroy$ = new Subject<void>();
  private stopPoll$ = new Subject<void>();

  constructor(private route: ActivatedRoute, private vnpay: VnpayService) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.queryParamMap.get('orderId'));
    if (!Number.isSafeInteger(this.orderId) || this.orderId <= 0) {
      this.error = 'Không xác minh được liên kết thanh toán. Vui lòng mở đơn hàng của bạn để kiểm tra.';
      return;
    }
    // Read the result already validated by the return/IPN endpoint. Do not block it on QUERYDR.
    timer(0, 3000).pipe(
      take(20), takeUntil(this.destroy$), takeUntil(this.stopPoll$),
      exhaustMap(() => this.vnpay.status(this.orderId)),
    ).subscribe({
      next: response => this.accept(response.data),
      error: () => { this.error = 'Chưa kết nối được với website. Bạn có thể kiểm tra lại kết quả.'; },
    });
  }

  get paid(): boolean { return this.status?.paymentStatus === 'Paid'; }
  get heading(): string {
    if (this.paid) { return 'Thanh toán thành công'; }
    if (this.status?.attemptStatus === 'Cancelled') { return 'Bạn đã hủy thanh toán'; }
    if (this.status?.attemptStatus === 'Failed') { return 'Thanh toán chưa thành công'; }
    if (this.status?.attemptStatus === 'Expired') { return 'Phiên thanh toán đã hết hạn'; }
    return this.pending ? 'Đang xác minh thanh toán' : 'Kết quả thanh toán';
  }
  get pending(): boolean {
    return this.status?.attemptStatus === 'Pending' || this.status?.attemptStatus === 'NeedsReconciliation';
  }

  check(): void {
    if (this.checking || !this.orderId) { return; }
    this.checking = true;
    this.error = '';
    this.vnpay.reconcile(this.orderId).pipe(takeUntil(this.destroy$)).subscribe({
      next: response => { this.checking = false; this.accept(response.data); },
      error: error => {
        this.checking = false;
        this.error = error?.error?.message || 'Không thể kiểm tra kết quả. Vui lòng thử lại.';
      },
    });
  }

  pay(): void {
    if (this.paying || !this.status?.canPay) { return; }
    this.paying = true;
    this.error = '';
    this.vnpay.createPaymentUrl(this.orderId).pipe(takeUntil(this.destroy$)).subscribe({
      next: response => this.vnpay.redirectToPayment(response.data.paymentUrl),
      error: error => {
        this.paying = false;
        this.error = error?.error?.message || 'Chưa tạo được liên kết thanh toán.';
      },
    });
  }

  private accept(status: VnpayStatus): void {
    this.status = status;
    if (status.paymentStatus === 'Paid' || !this.pending || status.requiresReview) { this.stopPoll$.next(); }
  }

  ngOnDestroy(): void {
    this.destroy$.next(); this.destroy$.complete(); this.stopPoll$.complete();
  }
}
