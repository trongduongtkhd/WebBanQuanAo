import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Cart } from '../../../../core/models/cart.model';
import { CartService } from '../../../../core/services/cart.service';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

import { CartComponent } from './cart.component';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let http: HttpTestingController;
  let headerCount: number;
  let before: Cart;

  function makeCart(): Cart {
    return { items: [
      { cartItemId: 1, variantId: 1, productId: 1, productName: 'Áo nỉ', colorName: 'Đen', sizeName: 'L', unitPrice: 100000, stockQuantity: 10, quantity: 1, totalPrice: 100000, isAvailable: true, isForSale: true },
      { cartItemId: 2, variantId: 2, productId: 2, productName: 'Áo Polo', colorName: 'Be', sizeName: 'M', unitPrice: 150000, stockQuantity: 10, quantity: 3, totalPrice: 450000, isAvailable: true, isForSale: true },
      { cartItemId: 3, variantId: 3, productId: 3, productName: 'Áo Len Nữ', colorName: 'Đen', sizeName: 'L', unitPrice: 150000, stockQuantity: 1, quantity: 2, totalPrice: 300000, isAvailable: false, isForSale: true },
    ], subtotal: 850000, totalQuantity: 6, shippingFee: 0, freeShippingThreshold: 500000 };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, HttpClientTestingModule, RouterTestingModule],
      declarations: [CartComponent, ImageUrlPipe],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(CartService).cartCount$.subscribe(count => headerCount = count);
    before = makeCart();
    fixture.detectChanges();
    http.expectOne(request => request.method === 'GET' && request.url.endsWith('/cart'))
      .flush({ success: true, message: 'Giỏ hàng', data: before });
    fixture.detectChanges();
  });

  afterEach(() => { http.verify(); });

  function showSingleItem(quantity: number, stockQuantity: number, isForSale = true): Cart {
    const item = { ...before.items[0], quantity, stockQuantity, isForSale,
      isAvailable: isForSale && quantity <= stockQuantity && quantity <= 100,
      totalPrice: quantity * before.items[0].unitPrice };
    const cart = { ...before, items: [item], totalQuantity: quantity, subtotal: item.totalPrice };
    component.cart = cart;
    fixture.detectChanges();
    return cart;
  }

  [1, 2].forEach(stock => {
    it(`lets the minus button repair quantity 5 to current stock ${stock}`, () => {
      const cart = showSingleItem(5, stock);
      const buttons = fixture.nativeElement.querySelectorAll('.quantity-button');
      expect(buttons[0].disabled).toBeFalse();
      expect(buttons[1].disabled).toBeTrue();
      expect(fixture.nativeElement.textContent).toContain(`Chỉ còn ${stock} sản phẩm`);
      buttons[0].click();
      const request = http.expectOne(r => r.method === 'PUT' && r.url.endsWith('/cart/items/1'));
      expect(request.request.body).toEqual({ quantity: stock });
      request.flush({ success: true, data: { ...cart,
        items: [{ ...cart.items[0], quantity: stock, totalPrice: stock * 100000, isAvailable: true }],
        totalQuantity: stock, subtotal: stock * 100000 } });
      fixture.detectChanges();
      expect(component.cart?.items[0].quantity).toBe(stock);
      expect(headerCount).toBe(stock);
      expect(component.cart?.subtotal).toBe(stock * 100000);
      expect(fixture.nativeElement.textContent).not.toContain('Chỉ còn');
    });
  });

  [
    { quantity: 5, stock: 0, forSale: true },
    { quantity: 5, stock: 2, forSale: false },
    { quantity: 1, stock: 20, forSale: true },
  ].forEach(test => {
    it(`does not decrease unavailable or minimum quantity: ${JSON.stringify(test)}`, () => {
      const cart = showSingleItem(test.quantity, test.stock, test.forSale);
      expect(fixture.nativeElement.querySelector('.quantity-button').disabled).toBeTrue();
      component.decreaseQuantity(cart.items[0]);
      http.expectNone(r => r.method === 'PUT');
    });
  });

  it('disables increasing at 100 even when stock is 200', () => {
    const cart = showSingleItem(100, 200);
    expect(fixture.nativeElement.querySelectorAll('.quantity-button')[1].disabled).toBeTrue();
    component.increaseQuantity(cart.items[0]);
    http.expectNone(r => r.method === 'PUT');
  });

  it('allows increasing from 99 to the boundary 100', () => {
    showSingleItem(99, 200);
    fixture.nativeElement.querySelectorAll('.quantity-button')[1].click();
    const request = http.expectOne(r => r.method === 'PUT' && r.url.endsWith('/cart/items/1'));
    expect(request.request.body.quantity).toBe(100);
    request.flush({ success: true, data: showSingleItem(100, 200) });
    fixture.detectChanges();
    expect(headerCount).toBe(100);
    expect(fixture.nativeElement.querySelectorAll('.quantity-button')[1].disabled).toBeTrue();
  });

  it('repairs a legacy quantity above 100 with the minus button', () => {
    showSingleItem(150, 200);
    fixture.nativeElement.querySelector('.quantity-button').click();
    const request = http.expectOne(r => r.method === 'PUT' && r.url.endsWith('/cart/items/1'));
    expect(request.request.body.quantity).toBe(100);
    request.flush({ success: true, data: showSingleItem(100, 200) });
    expect(headerCount).toBe(100);
  });

  it('refreshes stock after rejection so the customer can retry with the current stock', () => {
    const cart = showSingleItem(5, 2);
    fixture.nativeElement.querySelector('.quantity-button').click();
    http.expectOne(r => r.method === 'PUT').flush(
      { message: 'Số lượng trong giỏ không được vượt quá tồn kho (1).' },
      { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();
    expect(component.cart).toBe(cart);
    http.expectOne(r => r.method === 'GET' && r.url.endsWith('/cart')).flush({ success: true,
      data: { ...cart, items: [{ ...cart.items[0], stockQuantity: 1 }] } });
    fixture.detectChanges();
    expect(component.updatingItemId).toBeNull();
    expect(component.errorMessage).toContain('tồn kho (1)');
    fixture.nativeElement.querySelector('.quantity-button').click();
    const retry = http.expectOne(r => r.method === 'PUT');
    expect(retry.request.body.quantity).toBe(1);
    retry.flush({ success: true, data: showSingleItem(1, 1) });
    expect(component.cart?.items[0].quantity).toBe(1);
  });

  it('preserves the cart and original error if refreshing stock also fails', () => {
    const cart = showSingleItem(5, 2);
    component.decreaseQuantity(cart.items[0]);
    http.expectOne(r => r.method === 'PUT').flush({ message: 'Tồn kho vừa thay đổi.' },
      { status: 400, statusText: 'Bad Request' });
    http.expectOne(r => r.method === 'GET').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(component.cart).toBe(cart);
    expect(component.errorMessage).toBe('Tồn kho vừa thay đổi.');
    expect(component.updatingItemId).toBeNull();
  });

  it('deletes only the selected row and keeps other products, totals and header count correct', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    fixture.nativeElement.querySelectorAll('.remove-button')[1].click();
    const remaining: Cart = { ...before, items: [before.items[0], before.items[2]],
      subtotal: 400000, totalQuantity: 3, shippingFee: 30000 };
    http.expectOne(request => request.method === 'DELETE' && request.url.endsWith('/cart/items/2'))
      .flush({ success: true, message: 'Đã xóa', data: remaining });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.cart-item').length).toBe(2);
    const names = Array.from(fixture.nativeElement.querySelectorAll('.product-name'))
      .map((element: any) => element.textContent.trim());
    expect(names).toEqual(['Áo nỉ', 'Áo Len Nữ']);
    expect(component.cart?.subtotal).toBe(400000);
    expect(fixture.nativeElement.querySelector('.summary-total').textContent).toContain('400,000');
    expect(headerCount).toBe(3);
    expect(component.removingItemId).toBeNull();
  });

  it('shows the empty-cart view and resets the header when the last item is deleted', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.cart = { ...before, items: [before.items[0]], subtotal: 100000, totalQuantity: 1 };
    fixture.detectChanges();
    fixture.nativeElement.querySelector('.remove-button').click();
    http.expectOne(request => request.method === 'DELETE' && request.url.endsWith('/cart/items/1'))
      .flush({ success: true, message: 'Đã xóa', data: {
        items: [], subtotal: 0, totalQuantity: 0, shippingFee: 30000, freeShippingThreshold: 500000,
      } });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty-cart').textContent).toContain('Giỏ hàng của bạn đang trống');
    expect(fixture.nativeElement.querySelectorAll('.cart-item').length).toBe(0);
    expect(headerCount).toBe(0);
  });

  [
    { success: true, message: 'Deleted', data: null },
    { success: true, message: 'Deleted' },
    null,
  ].forEach(body => {
    it(`reloads the remaining cart without F5 when DELETE has no cart: ${JSON.stringify(body)}`, () => {
      spyOn(window, 'confirm').and.returnValue(true);
      fixture.nativeElement.querySelectorAll('.remove-button')[1].click();
      http.expectOne(r => r.method === 'DELETE' && r.url.endsWith('/cart/items/2'))
        .flush(body);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.cart-item').length).toBe(3);
      expect(headerCount).toBe(6);
      expect(component.removingItemId).toBe(2);

      const remaining: Cart = { ...before, items: [before.items[0], before.items[2]],
        subtotal: 400000, totalQuantity: 3, shippingFee: 30000 };
      http.expectOne(r => r.method === 'GET' && r.url.endsWith('/cart'))
        .flush({ success: true, data: remaining });
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('.cart-item').length).toBe(2);
      expect(component.cart).toEqual(remaining);
      expect(headerCount).toBe(3);
      expect(component.removingItemId).toBeNull();
    });
  });

  it('shows the empty-cart view after reloading when DELETE omits the last-item cart', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    showSingleItem(1, 10);
    fixture.nativeElement.querySelector('.remove-button').click();
    http.expectOne(r => r.method === 'DELETE').flush({ success: true, data: null });
    http.expectOne(r => r.method === 'GET').flush({ success: true, data: {
      ...before, items: [], subtotal: 0, totalQuantity: 0,
    } });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.empty-cart')).not.toBeNull();
    expect(headerCount).toBe(0);
    expect(component.removingItemId).toBeNull();
  });

  it('keeps the cart visible and reports an error if reloading after deletion fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    fixture.nativeElement.querySelector('.remove-button').click();
    http.expectOne(r => r.method === 'DELETE').flush({ success: true, data: null });
    http.expectOne(r => r.method === 'GET').flush({ message: 'Cannot reload cart' },
      { status: 503, statusText: 'Unavailable' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.cart-item').length).toBe(3);
    expect(headerCount).toBe(6);
    expect(component.removingItemId).toBeNull();
    expect(component.errorMessage).toBe('Cannot reload cart');
  });

  it('keeps every row and sends no delete request when confirmation is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    fixture.nativeElement.querySelector('.remove-button').click();
    expect(component.cart?.items.length).toBe(3);
    expect(headerCount).toBe(6);
    http.expectNone(request => request.method === 'DELETE');
  });

  it('preserves the cart and header count if the delete fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    fixture.nativeElement.querySelector('.remove-button').click();
    http.expectOne(request => request.method === 'DELETE' && request.url.endsWith('/cart/items/1'))
      .flush({ message: 'Không thể xóa sản phẩm.' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.cart-item').length).toBe(3);
    expect(component.cart?.subtotal).toBe(850000);
    expect(headerCount).toBe(6);
    expect(component.removingItemId).toBeNull();
    expect(component.errorMessage).toBe('Không thể xóa sản phẩm.');
  });
});
