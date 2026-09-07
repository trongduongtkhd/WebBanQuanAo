import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import { Cart } from '../../../../core/models/cart.model';
import {
  Address,
  CouponValidation,
  MockQr,
  OrderDetail,
} from '../../../../core/models/checkout.model';
import { CartService } from '../../../../core/services/cart.service';
import { CheckoutService } from '../../../../core/services/checkout.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  cart: Cart | null = null;
  addresses: Address[] = [];

  selectedAddressId: number | null = null;

  couponCode = '';
  appliedCoupon: CouponValidation | null = null;

  // COD = 1, MockQR = 2
  selectedPaymentMethod = 1;

  note = '';

  loading = true;
  applyingCoupon = false;
  creatingOrder = false;
  confirmingQr = false;

  errorMessage = '';
  couponErrorMessage = '';
  successMessage = '';

  createdOrder: OrderDetail | null = null;
  mockQr: MockQr | null = null;
  paymentConfirmed = false;

  constructor(
    private cartService: CartService,
    private checkoutService: CheckoutService,
  ) {}

  ngOnInit(): void {
    this.loadCheckoutData();
  }

  loadCheckoutData(): void {
    this.loading = true;

    forkJoin({
      cartResponse: this.cartService.getCart(),
      addressResponse: this.checkoutService.getMyAddresses(),
    }).subscribe({
      next: ({ cartResponse, addressResponse }) => {
        this.cart = cartResponse.data;
        this.addresses = addressResponse.data || [];

        const defaultAddress = this.addresses.find((x) => x.isDefault);

        this.selectedAddressId =
          defaultAddress?.addressId || this.addresses[0]?.addressId || null;

        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Không thể tải dữ liệu thanh toán.';
      },
    });
  }

  get discountAmount(): number {
    return this.appliedCoupon?.discountAmount || 0;
  }

  get amountAfterDiscount(): number {
    if (!this.cart) {
      return 0;
    }

    return Math.max(0, this.cart.subtotal - this.discountAmount);
  }

  get canCreateOrder(): boolean {
    return (
      !!this.cart &&
      this.cart.items.length > 0 &&
      !!this.selectedAddressId &&
      !this.creatingOrder
    );
  }

  applyCoupon(): void {
    const code = this.couponCode.trim();

    this.couponErrorMessage = '';
    this.successMessage = '';

    if (!code) {
      this.couponErrorMessage = 'Vui lòng nhập mã giảm giá.';
      return;
    }

    this.applyingCoupon = true;

    this.checkoutService.validateCoupon(code).subscribe({
      next: (response) => {
        this.appliedCoupon = response.data;
        this.applyingCoupon = false;
        this.successMessage = response.message;
      },
      error: (error) => {
        this.appliedCoupon = null;
        this.applyingCoupon = false;
        this.couponErrorMessage =
          error?.error?.message || 'Mã giảm giá không hợp lệ.';
      },
    });
  }

  removeCoupon(): void {
    this.appliedCoupon = null;
    this.couponCode = '';
    this.couponErrorMessage = '';
    this.successMessage = '';
  }

  createOrder(): void {
    this.errorMessage = '';

    if (!this.selectedAddressId) {
      this.errorMessage = 'Vui lòng chọn địa chỉ giao hàng.';
      return;
    }

    if (!this.cart || this.cart.items.length === 0) {
      this.errorMessage = 'Giỏ hàng hiện đang trống.';
      return;
    }

    this.creatingOrder = true;

    this.checkoutService
      .createOrder({
        addressId: this.selectedAddressId,
        paymentMethod: this.selectedPaymentMethod,
        couponCode: this.appliedCoupon?.couponCode || null,
        note: this.note.trim() || null,
      })
      .subscribe({
        next: (response) => {
          this.createdOrder = response.data;
          this.creatingOrder = false;

          // Backend đã chuyển Cart thành Order thành công.
          this.cartService.refreshCartCount();

          if (this.selectedPaymentMethod === 2) {
            this.loadMockQr();
          }
        },
        error: (error) => {
          this.creatingOrder = false;
          this.errorMessage =
            error?.error?.message || 'Không thể tạo đơn hàng.';
        },
      });
  }

  loadMockQr(): void {
    if (!this.createdOrder) {
      return;
    }

    this.checkoutService.getMockQr(this.createdOrder.orderId).subscribe({
      next: (response) => {
        this.mockQr = response.data;
      },
      error: (error) => {
        this.errorMessage =
          error?.error?.message || 'Không thể tải thông tin QR mô phỏng.';
      },
    });
  }

  confirmMockQr(): void {
    if (!this.createdOrder) {
      return;
    }

    this.confirmingQr = true;

    this.checkoutService.confirmMockQr(this.createdOrder.orderId).subscribe({
      next: () => {
        this.confirmingQr = false;
        this.paymentConfirmed = true;

        if (this.createdOrder) {
          this.createdOrder.paymentStatus = 2; // Paid
        }
      },
      error: (error) => {
        this.confirmingQr = false;
        this.errorMessage =
          error?.error?.message || 'Không thể xác nhận thanh toán.';
      },
    });
  }

  getAddressText(address: Address): string {
    return [
      address.addressDetail,
      address.ward,
      address.district,
      address.province,
    ]
      .filter(Boolean)
      .join(', ');
  }
}
