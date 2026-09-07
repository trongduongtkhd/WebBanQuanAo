import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderDetail } from '../../../../../core/models/order.model';
import { AdminOrderService } from '../../../services/admin-order.service';

@Component({
  selector: 'app-admin-order-detail',
  templateUrl: './admin-order-detail.component.html',
  styleUrls: ['./admin-order-detail.component.scss'],
})
export class AdminOrderDetailComponent implements OnInit {
  order: OrderDetail | null = null;

  loading = true;
  updatingOrderStatus = false;
  updatingPaymentStatus = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminOrderService: AdminOrderService,
  ) {}

  ngOnInit(): void {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));

    if (!orderId) {
      this.loading = false;
      this.errorMessage = 'Mã đơn hàng không hợp lệ.';
      return;
    }

    this.loadOrder(orderId);
  }

  loadOrder(orderId: number): void {
    this.loading = true;

    this.adminOrderService.getById(orderId).subscribe({
      next: (response) => {
        this.order = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Không thể tải chi tiết đơn hàng.';
      },
    });
  }

  get nextOrderStatus(): number | null {
    const current = this.normalizeOrderStatus(this.order?.orderStatus);

    const nextMap: { [key: number]: number } = {
      1: 2, // Pending -> Confirmed
      2: 3, // Confirmed -> Shipping
      3: 4, // Shipping -> Completed
    };

    return nextMap[current] || null;
  }

  get nextOrderStatusLabel(): string {
    const next = this.nextOrderStatus;

    return next ? this.getOrderStatusText(next) : '';
  }

  get nextPaymentStatus(): number | null {
    const current = this.normalizePaymentStatus(this.order?.paymentStatus);

    if (current === 1) {
      return 2; // Unpaid -> Paid
    }

    if (current === 2) {
      return 4; // Paid -> Refunded
    }

    return null;
  }

  get nextPaymentStatusLabel(): string {
    const next = this.nextPaymentStatus;

    return next ? this.getPaymentStatusText(next) : '';
  }

  updateOrderStatus(): void {
    if (!this.order || !this.nextOrderStatus) {
      return;
    }

    const note = window.prompt(
      `Ghi chú khi chuyển sang "${this.nextOrderStatusLabel}" (có thể bỏ trống):`,
    );

    if (note === null) {
      return;
    }

    this.updatingOrderStatus = true;
    this.errorMessage = '';

    this.adminOrderService
      .updateOrderStatus(this.order.orderId, {
        status: this.nextOrderStatus,
        note: note.trim() || null,
      })
      .subscribe({
        next: (response) => {
          this.order = response.data;
          this.updatingOrderStatus = false;
          this.successMessage = 'Đã cập nhật trạng thái đơn hàng.';
        },
        error: (error) => {
          this.updatingOrderStatus = false;
          this.errorMessage =
            error?.error?.message || 'Không thể cập nhật trạng thái đơn.';
        },
      });
  }

  updatePaymentStatus(): void {
    if (!this.order || !this.nextPaymentStatus) {
      return;
    }

    const note = window.prompt(
      `Ghi chú khi chuyển sang "${this.nextPaymentStatusLabel}" (có thể bỏ trống):`,
    );

    if (note === null) {
      return;
    }

    this.updatingPaymentStatus = true;
    this.errorMessage = '';

    this.adminOrderService
      .updatePaymentStatus(this.order.orderId, {
        paymentStatus: this.nextPaymentStatus,
        note: note.trim() || null,
      })
      .subscribe({
        next: () => {
          this.updatingPaymentStatus = false;
          this.successMessage = 'Đã cập nhật trạng thái thanh toán.';
          this.loadOrder(this.order!.orderId);
        },
        error: (error) => {
          this.updatingPaymentStatus = false;
          this.errorMessage =
            error?.error?.message || 'Không thể cập nhật thanh toán.';
        },
      });
  }

  goBack(): void {
    this.router.navigate(['/admin/orders']);
  }

  getOrderStatusText(status: number | string): string {
    const map: { [key: string]: string } = {
      '1': 'Chờ xác nhận',
      '2': 'Đã xác nhận',
      '3': 'Đang giao hàng',
      '4': 'Hoàn thành',
      '5': 'Đã hủy',
      Pending: 'Chờ xác nhận',
      Confirmed: 'Đã xác nhận',
      Shipping: 'Đang giao hàng',
      Completed: 'Hoàn thành',
      Cancelled: 'Đã hủy',
    };

    return map[String(status)] || 'Không xác định';
  }

  getPaymentStatusText(status: number | string): string {
    const map: { [key: string]: string } = {
      '1': 'Chưa thanh toán',
      '2': 'Đã thanh toán',
      '3': 'Thanh toán thất bại',
      '4': 'Đã hoàn tiền',
      Unpaid: 'Chưa thanh toán',
      Paid: 'Đã thanh toán',
      Failed: 'Thanh toán thất bại',
      Refunded: 'Đã hoàn tiền',
    };

    return map[String(status)] || 'Không xác định';
  }

  getPaymentMethodText(method: number | string): string {
    const map: { [key: string]: string } = {
      '1': 'COD',
      '2': 'QR mô phỏng',
      COD: 'COD',
      MockQR: 'QR mô phỏng',
      MockQr: 'QR mô phỏng',
    };

    return map[String(method)] || 'Không xác định';
  }

  private normalizeOrderStatus(status: number | string | undefined): number {
    const map: { [key: string]: number } = {
      Pending: 1,
      Confirmed: 2,
      Shipping: 3,
      Completed: 4,
      Cancelled: 5,
    };

    return map[String(status)] || Number(status);
  }

  private normalizePaymentStatus(status: number | string | undefined): number {
    const map: { [key: string]: number } = {
      Unpaid: 1,
      Paid: 2,
      Failed: 3,
      Refunded: 4,
    };

    return map[String(status)] || Number(status);
  }
}
