import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  MockQr,
  OrderDetail,
  Payment,
} from '../../../../core/models/order.model';
import { CustomerOrderService } from '../../../../core/services/customer-order.service';
import { ReviewService } from '../../../../core/services/review.service';
import { VnpayService, VnpayStatus } from '../../../../core/services/vnpay.service';
@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.scss'],
})
export class OrderDetailComponent implements OnInit {
  order: OrderDetail | null = null;
  mockQr: MockQr | null = null;
  vnpayStatus: VnpayStatus | null = null;
  checkingVnpay = false;
  payingVnpay = false;

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

  showReturnForm = false;
  returnReason = '';
  submittingReturn = false;
  returnErrorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private customerOrderService: CustomerOrderService,
    private reviewService: ReviewService,
    private vnpay: VnpayService,
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

        if (this.isVnpay) {
          this.vnpay.status(orderId).subscribe({
            next: result => this.vnpayStatus = result.data,
            error: () => this.vnpayStatus = null,
          });
        }

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

  get isVnpay(): boolean {
    return !!this.order?.payments.some(payment => this.normalizePaymentMethod(payment.paymentMethod) === 3);
  }

  checkVnpay(): void {
    if (!this.order || this.checkingVnpay) { return; }
    this.checkingVnpay = true;
    this.errorMessage = '';
    this.vnpay.reconcile(this.order.orderId).subscribe({
      next: result => {
        this.vnpayStatus = result.data;
        this.checkingVnpay = false;
        this.loadOrder(result.data.orderId);
      },
      error: error => {
        this.checkingVnpay = false;
        this.errorMessage = error?.error?.message || 'Không thể kiểm tra thanh toán.';
      },
    });
  }

  payVnpay(): void {
    if (!this.order || this.payingVnpay || !this.vnpayStatus?.canPay) { return; }
    this.payingVnpay = true;
    this.errorMessage = '';
    this.vnpay.createPaymentUrl(this.order.orderId).subscribe({
      next: result => this.vnpay.redirectToPayment(result.data.paymentUrl),
      error: error => {
        this.payingVnpay = false;
        this.errorMessage = error?.error?.message || 'Chưa tạo được liên kết VNPAY.';
      },
    });
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

  get isReturned(): boolean {
    return this.normalizeOrderStatus(this.order?.orderStatus) === 6;
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

  openReturnForm(): void {
    this.showReturnForm = true;
    this.returnReason = '';
    this.returnErrorMessage = '';
  }

  closeReturnForm(): void {
    this.showReturnForm = false;
    this.returnErrorMessage = '';
  }

  submitReturnRequest(): void {
    if (!this.order) {
      return;
    }

    const reason = this.returnReason.trim();

    if (reason.length < 10) {
      this.returnErrorMessage = 'Vui lòng mô tả lý do trả hàng (ít nhất 10 ký tự).';
      return;
    }

    this.submittingReturn = true;
    this.returnErrorMessage = '';

    this.customerOrderService
      .requestReturn(this.order.orderId, reason)
      .subscribe({
        next: (response) => {
          this.submittingReturn = false;
          this.showReturnForm = false;
          this.order = response.data;
          this.successMessage = response.message;
        },
        error: (error) => {
          this.submittingReturn = false;
          this.returnErrorMessage =
            error?.error?.message || 'Không thể gửi yêu cầu trả hàng.';
        },
      });
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

  getOrderStatusClass(status: number | string): string {
    const map: { [key: number]: string } = {
      1: 'pending',
      2: 'processing',
      3: 'processing',
      4: 'completed',
      5: 'cancelled',
      6: 'cancelled',
    };

    return map[this.normalizeOrderStatus(status)] || 'pending';
  }

  getPaymentStatusClass(status: number | string): string {
    const map: { [key: number]: string } = {
      1: 'bg-secondary',
      2: 'bg-success',
      3: 'bg-danger',
      4: 'bg-danger',
    };

    return map[this.normalizePaymentStatus(status)] || 'bg-secondary';
  }

  isCodPayment(payment: Payment): boolean {
    return this.normalizePaymentMethod(payment.paymentMethod) === 1;
  }

  isPaidPayment(payment: Payment): boolean {
    return this.normalizePaymentStatus(payment.paymentStatus) === 2;
  }

  isUnpaidPayment(payment: Payment): boolean {
    return this.normalizePaymentStatus(payment.paymentStatus) === 1;
  }

  get isCancelled(): boolean {
    return this.normalizeOrderStatus(this.order?.orderStatus) === 5;
  }

  getPaymentMethodText(method: number | string): string {
    const map: { [key: string]: string } = {
      '1': 'Thanh toán khi nhận hàng (COD)',
      '2': 'Thanh toán QR mô phỏng',
      '3': 'VNPAY Sandbox',
      VnPay: 'VNPAY Sandbox',

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
      Returned: 6,
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
      VnPay: 3,
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
