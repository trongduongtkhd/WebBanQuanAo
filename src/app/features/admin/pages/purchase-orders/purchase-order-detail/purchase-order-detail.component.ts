import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { PurchaseOrderDetail } from '../../../../../core/models/admin.model';
import { AdminPurchaseOrderService } from '../../../services/admin-purchase-order.service';

@Component({
  selector: 'app-purchase-order-detail',
  templateUrl: './purchase-order-detail.component.html',
  styleUrls: ['./purchase-order-detail.component.scss'],
})
export class PurchaseOrderDetailComponent implements OnInit {
  purchaseOrder: PurchaseOrderDetail | null = null;

  isLoading = true;
  errorMessage = '';

  showCancelForm = false;
  cancelReason = '';
  isCancelling = false;
  cancelErrorMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly purchaseOrderService: AdminPurchaseOrderService,
  ) {}

  get isCancelled(): boolean {
    return this.purchaseOrder?.status === 'Cancelled';
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.purchaseOrderService.getById(id).subscribe({
      next: (response) => {
        this.purchaseOrder = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Không thể tải chi tiết phiếu nhập kho.';
        this.isLoading = false;
      },
    });
  }

  toggleCancelForm(): void {
    this.showCancelForm = !this.showCancelForm;
    this.cancelReason = '';
    this.cancelErrorMessage = '';
  }

  confirmCancel(): void {
    if (!this.purchaseOrder) {
      return;
    }

    if (!this.cancelReason.trim()) {
      this.cancelErrorMessage = 'Vui lòng nhập lý do hủy phiếu.';
      return;
    }

    if (
      !confirm(
        `Hủy phiếu ${this.purchaseOrder.purchaseOrderCode}? Tồn kho của các sản phẩm trong phiếu sẽ bị trừ lại và không thể hoàn tác.`,
      )
    ) {
      return;
    }

    this.isCancelling = true;
    this.cancelErrorMessage = '';

    this.purchaseOrderService
      .cancel(this.purchaseOrder.purchaseOrderId, this.cancelReason.trim())
      .subscribe({
        next: (response) => {
          this.purchaseOrder = response.data;
          this.isCancelling = false;
          this.showCancelForm = false;
        },
        error: (error: HttpErrorResponse) => {
          this.isCancelling = false;
          this.cancelErrorMessage =
            error.error?.message || 'Không thể hủy phiếu nhập kho.';
        },
      });
  }
}
