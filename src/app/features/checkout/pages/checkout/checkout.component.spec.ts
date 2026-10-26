import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject } from 'rxjs';
import { CartService } from '../../../../core/services/cart.service';
import { CatalogService } from '../../../../core/services/catalog.service';
import { CheckoutService } from '../../../../core/services/checkout.service';
import { VnpayService } from '../../../../core/services/vnpay.service';
import { CheckoutComponent } from './checkout.component';

describe('Checkout payment handoff', () => {
  let fixture: ComponentFixture<CheckoutComponent>;
  let component: CheckoutComponent;
  let checkout: jasmine.SpyObj<CheckoutService>;
  let vnpay: jasmine.SpyObj<VnpayService>;
  let catalog: jasmine.SpyObj<CatalogService>;
  let routeStub: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };
  const order: any = { orderId: 8011, orderCode: 'DH-TEST', totalAmount: 180000, shippingAddress: 'Test' };
  beforeEach(async () => {
    routeStub = { snapshot: { queryParamMap: convertToParamMap({}) } };
    checkout = jasmine.createSpyObj('CheckoutService', ['getMyAddresses', 'createOrder', 'getMockQr', 'confirmMockQr', 'validateCoupon']);
    checkout.getMyAddresses.and.returnValue(of({ data: [{ addressId: 1, receiverName: 'Test', isDefault: true }] } as any));
    checkout.createOrder.and.returnValue(of({ success: true, message: '', data: order }));
    checkout.getMockQr.and.returnValue(of({ data: { message: 'QR mock', amount: 180000 } } as any));
    checkout.validateCoupon.and.returnValue(of({ data: { couponCode: 'SAVE10', discountAmount: 10000 } } as any));
    catalog = jasmine.createSpyObj('CatalogService', ['getProductDetail']);
    catalog.getProductDetail.and.returnValue(of({ data: { productId: 10, productName: 'Khăn', images: [], variants: [
      { variantId: 4152, isActive: true, stockQuantity: 10, colorName: 'Trắng', sizeName: 'M', effectivePrice: 119000 },
    ] } } as any));
    vnpay = jasmine.createSpyObj('VnpayService', ['configuration', 'createPaymentUrl', 'redirectToPayment']);
    vnpay.configuration.and.returnValue(of({ enabled: true }));
    vnpay.createPaymentUrl.and.returnValue(new Subject<any>());
    const cart = jasmine.createSpyObj('CartService', ['getCart', 'refreshCartCount']);
    cart.getCart.and.returnValue(of({ data: {
      items: [{ productName: 'Áo Polo', quantity: 1, totalPrice: 150000 }],
      subtotal: 150000, shippingFee: 30000, freeShippingThreshold: 500000,
    } }));
    await TestBed.configureTestingModule({
      declarations: [CheckoutComponent], imports: [CommonModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: CheckoutService, useValue: checkout }, { provide: CartService, useValue: cart },
        { provide: CatalogService, useValue: catalog }, { provide: VnpayService, useValue: vnpay },
        { provide: ActivatedRoute, useValue: routeStub },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CheckoutComponent); component = fixture.componentInstance;
    fixture.detectChanges();
  });
  afterEach(() => fixture.destroy());

  it('shows only VNPAY handoff while waiting, even with a stale selection event', () => {
    const created = new Subject<any>(); checkout.createOrder.and.returnValue(created);
    component.selectedPaymentMethod = 3; component.createOrder();
    component.selectedPaymentMethod = 2;
    created.next({ data: order }); fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Đang chuyển đến VNPAY');
    expect(text).not.toContain('Đặt hàng thành công!');
    expect(text).not.toContain('QR thanh toán mô phỏng');
    expect(checkout.getMockQr).not.toHaveBeenCalled();
    expect(vnpay.createPaymentUrl).toHaveBeenCalledWith(8011);
  });
  it('keeps the order and exposes retry when gateway connection fails', () => {
    const pending = new Subject<any>(); vnpay.createPaymentUrl.and.returnValue(pending);
    component.selectedPaymentMethod = 3; component.createOrder();
    pending.error({ error: { message: 'Kết nối gián đoạn' } }); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Kết nối gián đoạn');
    expect(fixture.nativeElement.textContent).toContain('Tiếp tục thanh toán');
    component.createOrder(); expect(checkout.createOrder).toHaveBeenCalledTimes(1);
  });
  it('retains COD confirmation without contacting VNPAY', () => {
    component.selectedPaymentMethod = 1; component.createOrder(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Bạn đã chọn thanh toán COD');
    expect(vnpay.createPaymentUrl).not.toHaveBeenCalled();
  });
  it('loads QR only for the mock QR method', () => {
    component.selectedPaymentMethod = 2; component.createOrder(); fixture.detectChanges();
    expect(checkout.getMockQr).toHaveBeenCalledWith(8011);
    expect(vnpay.createPaymentUrl).not.toHaveBeenCalled();
  });
  it('ignores duplicate submissions while creating an order', () => {
    checkout.createOrder.and.returnValue(new Subject<any>());
    component.createOrder(); component.createOrder();
    expect(checkout.createOrder).toHaveBeenCalledTimes(1);
  });

  it('links an empty-address checkout to address creation with the complete buy-now URL', async () => {
    routeStub.snapshot.queryParamMap = convertToParamMap({ buyNow: '4152', qty: '2', slug: 'khan', coupon: 'OLD' });
    component.couponCode = 'SAVE10'; component.note = 'Giao buổi sáng'; component.selectedPaymentMethod = 2;
    component.addresses = []; component.selectedAddressId = null;
    fixture.detectChanges(); await fixture.whenStable();
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.alert-link');
    const query = new URL(link.href).searchParams;
    const returned = TestBed.inject(Router).parseUrl(query.get('returnUrl')!);
    expect(query.get('create')).toBe('1');
    expect(returned.queryParams).toEqual({ buyNow: '4152', qty: '2', slug: 'khan', coupon: 'SAVE10' });
    expect(component.checkoutDraft).toEqual({ couponCode: 'SAVE10', note: 'Giao buổi sáng', paymentMethod: 2 });
    expect(component.canCreateOrder).toBeFalse();
  });

  it('resumes buy-now, revalidates the coupon and selects the newly saved address', () => {
    const router = TestBed.inject(Router);
    spyOn(router, 'getCurrentNavigation').and.returnValue({ extras: { state: {
      checkoutDraft: { couponCode: 'SAVE10', note: 'Giao buổi sáng', paymentMethod: 2 },
    } } } as any);
    routeStub.snapshot.queryParamMap = convertToParamMap({ buyNow: '4152', qty: '2', slug: 'khan', addressId: '2' });
    checkout.getMyAddresses.and.returnValue(of({ data: [{ addressId: 1, isDefault: true }, { addressId: 2, isDefault: false }] } as any));
    component.ngOnInit();
    expect(component.buyNowItem).toEqual({ variantId: 4152, quantity: 2 });
    expect(component.selectedAddressId).toBe(2);
    expect(component.note).toBe('Giao buổi sáng');
    expect(component.selectedPaymentMethod).toBe(2);
    expect(checkout.validateCoupon).toHaveBeenCalledWith('SAVE10', { variantId: 4152, quantity: 2 });
    expect(component.cart?.subtotal).toBe(238000);
  });

  it('ignores an address ID outside the current user address list', () => {
    routeStub.snapshot.queryParamMap = convertToParamMap({ addressId: '9999' });
    component.loadCheckoutData();
    expect(component.selectedAddressId).toBe(1);
  });
});
