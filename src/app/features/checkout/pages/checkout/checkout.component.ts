import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Cart } from '../../../../core/models/cart.model';
import {
  Address,
  BuyNowItem,
  CouponValidation,
  MockQr,
  OrderDetail,
} from '../../../../core/models/checkout.model';
import { CartService } from '../../../../core/services/cart.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { CheckoutService } from '../../../../core/services/checkout.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { ActivatedRoute, Router } from '@angular/router';
import { VnpayService } from '../../../../core/services/vnpay.service';
import { CheckoutDraft, takeCheckoutDraft } from '../../../../core/utils/checkout-navigation.util';

// Khớp ShippingHelper ở backend.
const STANDARD_SHIPPING_FEE = 30000;
const FREE_SHIPPING_THRESHOLD = 500000;

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.scss'],
})
export class CheckoutComponent implements OnInit {
  cart: Cart | null = null;
  addresses: Address[] = [];

  // Khác null => đang ở chế độ "Mua ngay" (không dùng giỏ hàng).
  buyNowItem: BuyNowItem | null = null;
  private buyNowSlug: string | null = null;

  selectedAddressId: number | null = null;

  couponCode = '';
  appliedCoupon: CouponValidation | null = null;

  // COD = 1, MockQR = 2, VnPay = 3
  selectedPaymentMethod = 1;
  createdPaymentMethod: number | null = null;
  vnpayEnabled = false;
  redirectingToVnpay = false;

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
    private catalogService: CatalogService,
    private checkoutService: CheckoutService,
    private route: ActivatedRoute,
    private vnpay: VnpayService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    const navigationState = this.router.getCurrentNavigation()?.extras.state || window.history.state;
    const draft = takeCheckoutDraft(navigationState?.checkoutDraft);
    if (draft) {
      this.note = draft.note;
      this.selectedPaymentMethod = draft.paymentMethod;
    }
    this.vnpay.configuration().subscribe({
      next: config => {
        this.vnpayEnabled = config.enabled;
        if (!config.enabled && this.selectedPaymentMethod === 3) this.selectedPaymentMethod = 1;
      },
      error: () => {
        this.vnpayEnabled = false;
        if (this.selectedPaymentMethod === 3) this.selectedPaymentMethod = 1;
      },
    });
    const params = this.route.snapshot.queryParamMap;

    this.couponCode = draft?.couponCode ?? params.get('coupon') ?? '';

    const variantId = Number(params.get('buyNow'));
    const quantity = Number(params.get('qty')) || 1;

    // "Mua ngay": chỉ thanh toán sản phẩm được chọn, không đụng giỏ hàng.
    if (variantId > 0 && params.get('slug')) {
      this.buyNowItem = {
        variantId,
        quantity: Math.min(Math.max(1, Math.floor(quantity)), 100),
      };
      this.buyNowSlug = params.get('slug');
    }

    this.loadCheckoutData();
  }

  get addressReturnUrl(): string {
    const params = this.route.snapshot.queryParamMap;
    const queryParams: Record<string, string | string[] | null> = {};
    params.keys.forEach(key => queryParams[key] = params.getAll(key));
    queryParams.coupon = this.couponCode.trim() || null;
    return this.router.serializeUrl(this.router.createUrlTree(['/checkout'], { queryParams }));
  }

  get checkoutDraft(): CheckoutDraft {
    return { couponCode: this.couponCode, note: this.note, paymentMethod: this.selectedPaymentMethod };
  }

  loadCheckoutData(): void {
    this.loading = true;

    const cart$ = this.buyNowItem
      ? this.loadBuyNowCart()
      : this.cartService.getCart().pipe(map((response) => response.data));

    forkJoin({
      cart: cart$,
      addressResponse: this.checkoutService.getMyAddresses(),
    }).subscribe({
      next: ({ cart, addressResponse }) => {
        this.cart = cart;
        this.addresses = addressResponse.data || [];

        const defaultAddress = this.addresses.find((x) => x.isDefault);
        const returnedAddressId = Number(this.route.snapshot.queryParamMap.get('addressId'));
        const returnedAddress = this.addresses.find(x => x.addressId === returnedAddressId);

        this.selectedAddressId =
          returnedAddress?.addressId || defaultAddress?.addressId || this.addresses[0]?.addressId || null;

        this.loading = false;

        // Áp mã sau khi đã có sản phẩm/giỏ hàng để backend tính đúng.
        if (this.couponCode.trim()) {
          this.applyCoupon();
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = getApiErrorMessage(
          error,
          'Không thể tải dữ liệu thanh toán.',
        );
      },
    });
  }

  // Dựng một "giỏ" 1 dòng từ sản phẩm Mua ngay, công thức phí ship khớp ShippingHelper ở backend.
  private loadBuyNowCart(): Observable<Cart> {
    const item = this.buyNowItem as BuyNowItem;

    return this.catalogService.getProductDetail(this.buyNowSlug || '').pipe(
      map((response) => {
        const product = response.data;
        const variant = product.variants.find(
          (x) => x.variantId === item.variantId && x.isActive,
        );

        if (!variant) {
          throw { error: { message: 'Sản phẩm không còn được bán.' } };
        }

        if (variant.stockQuantity < item.quantity) {
          throw {
            error: {
              message: `Sản phẩm chỉ còn ${variant.stockQuantity} cái trong kho.`,
            },
          };
        }

        const unitPrice = variant.effectiveSalePrice || variant.effectivePrice;
        const subtotal = unitPrice * item.quantity;

        return {
          items: [
            {
              cartItemId: 0,
              variantId: variant.variantId,
              productId: product.productId,
              productName: product.productName,
              thumbnailUrl: variant.imageUrl || product.images?.[0]?.imageUrl,
              colorName: variant.colorName,
              sizeName: variant.sizeName,
              unitPrice,
              stockQuantity: variant.stockQuantity,
              quantity: item.quantity,
              totalPrice: subtotal,
              isAvailable: true,
              isForSale: true,
            },
          ],
          totalQuantity: item.quantity,
          subtotal,
          shippingFee:
            subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING_FEE,
          freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        };
      }),
    );
  }

  get discountAmount(): number {
    return this.appliedCoupon?.discountAmount || 0;
  }

  get shippingFee(): number {
    return this.cart?.shippingFee ?? 0;
  }

  // Khớp công thức backend: subtotal - giảm giá + phí ship.
  get totalAmount(): number {
    if (!this.cart) {
      return 0;
    }

    return (
      Math.max(0, this.cart.subtotal - this.discountAmount) + this.shippingFee
    );
  }

  get amountToFreeShipping(): number {
    if (!this.cart) {
      return 0;
    }

    return Math.max(0, this.cart.freeShippingThreshold - this.cart.subtotal);
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

    this.checkoutService.validateCoupon(code, this.buyNowItem).subscribe({
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
    if (this.creatingOrder || this.createdOrder) { return; }
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
    const paymentMethod = this.selectedPaymentMethod;

    this.checkoutService
      .createOrder({
        addressId: this.selectedAddressId,
        paymentMethod,
        couponCode: this.appliedCoupon?.couponCode || null,
        note: this.note.trim() || null,
        buyNowItem: this.buyNowItem,
      })
      .subscribe({
        next: (response) => {
          this.createdOrder = response.data;
          this.createdPaymentMethod = paymentMethod;
          this.creatingOrder = false;

          // Đặt từ giỏ: backend đã chuyển Cart thành Order. Mua ngay: giỏ giữ nguyên.
          this.cartService.refreshCartCount();

          if (paymentMethod === 2) {
            this.loadMockQr();
          } else if (paymentMethod === 3) {
            this.continueVnpay();
          }
        },
        error: (error) => {
          this.creatingOrder = false;
          this.errorMessage =
            error?.error?.message || 'Không thể tạo đơn hàng.';
        },
      });
  }

  continueVnpay(): void {
    if (!this.createdOrder || this.redirectingToVnpay) { return; }
    this.redirectingToVnpay = true;
    this.errorMessage = '';
    this.vnpay.createPaymentUrl(this.createdOrder.orderId).subscribe({
      next: response => this.vnpay.redirectToPayment(response.data.paymentUrl),
      error: error => {
        this.redirectingToVnpay = false;
        this.errorMessage = error?.error?.message || 'Đơn đã được tạo. Bạn có thể tiếp tục thanh toán trong chi tiết đơn hàng.';
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
