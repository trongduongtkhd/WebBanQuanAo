import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiResponse } from '../../../../../core/models/api-response.model';
import { OrderDetail } from '../../../../../core/models/order.model';
import { AdminOrderService } from '../../../services/admin-order.service';
import { getApiErrorMessage } from '../../../../../core/utils/api-error.util';

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
  processingReturn = false;

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

  get isCod(): boolean {
    return !!this.order?.payments.some(
      (payment) => this.normalizePaymentMethod(payment.paymentMethod) === 1,
    );
  }

  get isUnpaid(): boolean {
    return this.normalizePaymentStatus(this.order?.paymentStatus) === 1;
  }

  // Đơn COD chưa thu tiền mà bước tiếp theo là Hoàn thành: hoàn thành = giao hàng + thu tiền mặt.
  get isCodDeliveryStep(): boolean {
    return this.nextOrderStatus === 4 && this.isCod && this.isUnpaid;
  }

  // Chỉ còn bước Chưa thanh toán -> Đã thanh toán. Hoàn tiền đi qua duyệt yêu cầu trả hàng hoặc hủy đơn.
  get nextPaymentStatus(): number | null {
    const current = this.normalizePaymentStatus(this.order?.paymentStatus);
    const orderStatus = this.normalizeOrderStatus(this.order?.orderStatus);

    if (current !== 1 || orderStatus === 5 || orderStatus === 6) {
      return null;
    }

    // COD tự ghi nhận khi Hoàn thành; chỉ cho bấm tay với đơn đã Hoàn thành mà chưa thanh toán (dữ liệu cũ).
    return !this.isCod || orderStatus === 4 ? 2 : null;
  }

  // Pending = 1, Approved = 2, Rejected = 3
  get returnRequestStatus(): number {
    const map: { [key: string]: number } = {
      Pending: 1,
      Approved: 2,
      Rejected: 3,
    };
    const status = this.order?.returnRequest?.status;

    return map[String(status)] || Number(status) || 0;
  }

  approveReturn(): void {
    if (!this.order || this.returnRequestStatus !== 1) {
      return;
    }

    if (
      !window.confirm(
        `Duyệt trả hàng: hoàn ${this.order.totalAmount.toLocaleString('vi-VN')} ₫ cho khách và nhập lại kho?`,
      )
    ) {
      return;
    }

    const note = window.prompt('Ghi chú gửi khách (có thể bỏ trống):');

    if (note === null) {
      return;
    }

    this.processReturn(
      this.adminOrderService.approveReturn(
        this.order.orderId,
        note.trim() || null,
      ),
      'Không thể duyệt yêu cầu trả hàng.',
    );
  }

  rejectReturn(): void {
    if (!this.order || this.returnRequestStatus !== 1) {
      return;
    }

    const note = window.prompt('Lý do từ chối (bắt buộc, khách sẽ thấy):');

    if (note === null) {
      return;
    }

    if (!note.trim()) {
      this.successMessage = '';
      this.errorMessage = 'Vui lòng nhập lý do từ chối.';
      return;
    }

    this.processReturn(
      this.adminOrderService.rejectReturn(this.order.orderId, note.trim()),
      'Không thể từ chối yêu cầu trả hàng.',
    );
  }

  private processReturn(
    request$: Observable<ApiResponse<OrderDetail>>,
    fallbackError: string,
  ): void {
    this.processingReturn = true;
    this.errorMessage = '';
    this.successMessage = '';

    request$.subscribe({
      next: (response) => {
        this.order = response.data;
        this.processingReturn = false;
        this.successMessage = response.message;
      },
      error: (error) => {
        this.processingReturn = false;
        this.errorMessage = getApiErrorMessage(error, fallbackError);
      },
    });
  }

  get nextPaymentStatusLabel(): string {
    const next = this.nextPaymentStatus;

    return next ? this.getPaymentStatusText(next) : '';
  }

  updateOrderStatus(): void {
    if (!this.order || !this.nextOrderStatus) {
      return;
    }

    if (
      this.isCodDeliveryStep &&
      !window.confirm(
        `Xác nhận shipper đã giao hàng và thu đủ ${this.order.totalAmount.toLocaleString('vi-VN')} ₫ tiền mặt?`,
      )
    ) {
      return;
    }

    const note = window.prompt(
      `Ghi chú khi chuyển sang "${this.nextOrderStatusLabel}" (có thể bỏ trống):`,
    );

    if (note === null) {
      return;
    }

    this.sendOrderStatus(
      this.nextOrderStatus,
      note.trim() || null,
      'Đã cập nhật trạng thái đơn hàng.',
    );
  }

  // Chỉ đơn Chờ xử lý / Đã xác nhận mới hủy được (khớp IsValidStatusTransition ở backend).
  get canCancelOrder(): boolean {
    const current = this.normalizeOrderStatus(this.order?.orderStatus);

    return current === 1 || current === 2;
  }

  cancelOrder(): void {
    if (!this.order || !this.canCancelOrder) {
      return;
    }

    const reason = window.prompt(
      `Nhập lý do hủy đơn ${this.order.orderCode} (bắt buộc):`,
    );

    if (reason === null) {
      return;
    }

    if (!reason.trim()) {
      this.successMessage = '';
      this.errorMessage = 'Vui lòng nhập lý do hủy đơn.';
      return;
    }

    if (
      !window.confirm(
        'Hủy đơn này? Tồn kho và lượt dùng mã giảm giá sẽ được hoàn lại.',
      )
    ) {
      return;
    }

    this.sendOrderStatus(
      5,
      reason.trim(),
      'Đã hủy đơn hàng. Tồn kho và lượt dùng mã giảm giá đã được hoàn lại.',
    );
  }

  private sendOrderStatus(
    status: number,
    note: string | null,
    successMessage: string,
  ): void {
    if (!this.order) {
      return;
    }

    this.updatingOrderStatus = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminOrderService
      .updateOrderStatus(this.order.orderId, { status, note })
      .subscribe({
        next: (response) => {
          this.order = response.data;
          this.updatingOrderStatus = false;
          this.successMessage = successMessage;
        },
        error: (error) => {
          this.updatingOrderStatus = false;
          this.errorMessage = getApiErrorMessage(
            error,
            'Không thể cập nhật trạng thái đơn.',
          );
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
      '6': 'Đã trả hàng',
      Pending: 'Chờ xác nhận',
      Confirmed: 'Đã xác nhận',
      Shipping: 'Đang giao hàng',
      Completed: 'Hoàn thành',
      Cancelled: 'Đã hủy',
      Returned: 'Đã trả hàng',
    };

    return map[String(status)] || 'Không xác định';
  }

  getOrderStatusClass(status: number | string): string {
    const map: { [key: string]: string } = {
      '1': 'warning',
      '2': 'info',
      '3': 'primary',
      '4': 'success',
      '5': 'danger',
      '6': 'dark',
      Pending: 'warning',
      Confirmed: 'info',
      Shipping: 'primary',
      Completed: 'success',
      Cancelled: 'danger',
      Returned: 'dark',
    };

    return map[String(status)] || 'secondary';
  }

  getPaymentStatusClass(status: number | string): string {
    const map: { [key: string]: string } = {
      '1': 'secondary',
      '2': 'success',
      '3': 'danger',
      '4': 'danger',
      Unpaid: 'secondary',
      Paid: 'success',
      Failed: 'danger',
      Refunded: 'danger',
    };

    return map[String(status)] || 'secondary';
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
      Returned: 6,
    };

    return map[String(status)] || Number(status);
  }

  private normalizePaymentMethod(method: number | string | undefined): number {
    const map: { [key: string]: number } = {
      COD: 1,
      MockQR: 2,
      MockQr: 2,
    };

    return map[String(method)] || Number(method);
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
