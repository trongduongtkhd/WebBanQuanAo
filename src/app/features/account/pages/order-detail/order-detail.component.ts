import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MockQr, OrderDetail } from '../../../../core/models/order.model';
import { CustomerOrderService } from '../../../../core/services/customer-order.service';
import { ReviewService } from '../../../../core/services/review.service';
@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent implements OnInit {
  order: OrderDetail | null = null;
  mockQr: MockQr | null = null;

  loading = true;
  cancelling = false;
  confirmingQr = false;

  errorMessage = '';
  successMessage = '';
  showReviewForm = false;
  selectedOrderItemId: number | null = null;
  selectedProductName = '';

  reviewRating = 5;
  reviewComment = '';

  submittingReview = false;
  reviewErrorMessage = '';
  reviewSuccessMessage = '';
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerOrderService: CustomerOrderService,
    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    const orderId = Number(this.route.snapshot.paramMap.get('id'));

    if (!orderId) {
      this.errorMessage = 'Mã đơn hàng không hợp lệ.';
      this.loading = false;
      return;
    }

    this.loadOrder(orderId);
  }

  loadOrder(orderId: number): void {
    this.loading = true;

    this.customerOrderService.getById(orderId).subscribe({
      next: (response) => {
        this.order = response.data;
        this.loading = false;

        if (this.isMockQrUnpaid) {
          this.loadMockQr();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Không thể tải chi tiết đơn hàng.';
      },
    });
  }

  get isPending(): boolean {
    return this.normalizeOrderStatus(this.order?.orderStatus) === 1;
  }

  get isMockQrUnpaid(): boolean {
    if (!this.order) {
      return false;
    }

    const isUnpaid =
      this.normalizePaymentStatus(this.order.paymentStatus) === 1;

    const hasMockQrPayment = this.order.payments.some(
      (payment) => this.normalizePaymentMethod(payment.paymentMethod) === 2,
    );

    return isUnpaid && hasMockQrPayment;
  }

  cancelOrder(): void {
    if (!this.order) {
      return;
    }

    const reason = window.prompt('Nhập lý do hủy đơn (có thể bỏ trống):');

    if (reason === null) {
      return;
    }

    this.cancelling = true;
    this.errorMessage = '';

    this.customerOrderService
      .cancel(this.order.orderId, { reason: reason.trim() || null })
      .subscribe({
        next: (response) => {
          this.cancelling = false;
          this.successMessage = response.message || 'Đã hủy đơn hàng.';
          this.loadOrder(this.order!.orderId);
        },
        error: (error) => {
          this.cancelling = false;
          this.errorMessage =
            error?.error?.message || 'Không thể hủy đơn hàng.';
        },
      });
  }

  loadMockQr(): void {
    if (!this.order) {
      return;
    }

    this.customerOrderService.getMockQr(this.order.orderId).subscribe({
      next: (response) => {
        this.mockQr = response.data;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Không thể tải QR thanh toán.';
      },
    });
  }

  confirmMockQr(): void {
    if (!this.order) {
      return;
    }

    this.confirmingQr = true;

    this.customerOrderService.confirmMockQr(this.order.orderId).subscribe({
      next: (response) => {
        this.confirmingQr = false;
        this.successMessage = response.message || 'Thanh toán thành công.';
        this.loadOrder(this.order!.orderId);
      },
      error: (error) => {
        this.confirmingQr = false;
        this.errorMessage =
          error?.error?.message || 'Không thể xác nhận thanh toán.';
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/account/orders']);
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
      '1': 'Thanh toán khi nhận hàng (COD)',
      '2': 'Thanh toán QR mô phỏng',

      COD: 'Thanh toán khi nhận hàng (COD)',
      MockQR: 'Thanh toán QR mô phỏng',

      // Giữ thêm cách viết này để an toàn nếu backend đổi tên enum sau này.
      MockQr: 'Thanh toán QR mô phỏng',
    };

    return map[String(method)] || 'Không xác định';
  }

  getTimelineClass(status: number | string): string {
    if (!this.order) {
      return '';
    }

    const currentStatus = this.normalizeOrderStatus(this.order.orderStatus);
    const timelineStatus = this.normalizeOrderStatus(status);

    if (timelineStatus === 5) {
      return currentStatus === 5 ? 'active cancelled' : '';
    }

    return currentStatus >= timelineStatus && currentStatus !== 5
      ? 'active'
      : '';
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

  private normalizePaymentMethod(method: number | string | undefined): number {
    const map: { [key: string]: number } = {
      COD: 1,
      MockQR: 2,
      MockQr: 2,
    };

    return map[String(method)] || Number(method);
  }

  get isCompleted(): boolean {
    return this.normalizeOrderStatus(this.order?.orderStatus) === 4;
  }

  openReviewForm(orderItemId: number, productName: string): void {
    this.selectedOrderItemId = orderItemId;
    this.selectedProductName = productName;

    this.reviewRating = 5;
    this.reviewComment = '';

    this.reviewErrorMessage = '';
    this.reviewSuccessMessage = '';

    this.showReviewForm = true;
  }

  closeReviewForm(): void {
    if (this.submittingReview) {
      return;
    }

    this.showReviewForm = false;
    this.selectedOrderItemId = null;
  }

  submitReview(): void {
    if (!this.selectedOrderItemId) {
      return;
    }

    this.reviewErrorMessage = '';
    this.reviewSuccessMessage = '';

    if (this.reviewRating < 1 || this.reviewRating > 5) {
      this.reviewErrorMessage = 'Vui lòng chọn số sao từ 1 đến 5.';
      return;
    }

    this.submittingReview = true;

    this.reviewService
      .create({
        orderItemId: this.selectedOrderItemId,
        rating: this.reviewRating,
        comment: this.reviewComment.trim() || null,
      })
      .subscribe({
        next: (response) => {
          this.submittingReview = false;
          this.reviewSuccessMessage = response.message;
          this.showReviewForm = false;
        },
        error: (error) => {
          this.submittingReview = false;
          this.reviewErrorMessage =
            error?.error?.message || 'Không thể gửi đánh giá.';
        },
      });
  }
}
