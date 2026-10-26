import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';
import { AddressService } from '../../../../core/services/address.service';
import { AddressesComponent } from './addresses.component';

describe('AddressesComponent', () => {
  let component: AddressesComponent;
  let fixture: ComponentFixture<AddressesComponent>;
  let service: jasmine.SpyObj<AddressService>;
  let router: Router;
  let navigate: jasmine.Spy;
  let route: { snapshot: { queryParamMap: ReturnType<typeof convertToParamMap> } };
  const checkoutUrl = '/checkout?buyNow=4152&qty=2&slug=khan&coupon=SAVE10';
  const draft = { couponCode: 'SAVE10', note: 'Giao buổi sáng', paymentMethod: 2 };

  beforeEach(async () => {
    route = { snapshot: { queryParamMap: convertToParamMap({}) } };
    service = jasmine.createSpyObj('AddressService', ['getMyAddresses', 'create', 'update', 'setDefault', 'delete']);
    service.getMyAddresses.and.returnValue(of({ success: true, message: '', data: [] }));
    service.create.and.returnValue(of({ success: true, message: 'Đã lưu', data: { addressId: 42 } } as any));
    await TestBed.configureTestingModule({
      declarations: [AddressesComponent], imports: [ReactiveFormsModule, RouterTestingModule],
      providers: [{ provide: AddressService, useValue: service }, { provide: ActivatedRoute, useValue: route }],
    }).compileComponents();
    router = TestBed.inject(Router);
    navigate = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    spyOn(router, 'getCurrentNavigation').and.returnValue({ extras: { state: { checkoutDraft: draft } } } as any);
    fixture = TestBed.createComponent(AddressesComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  function openFromCheckout(): void {
    route.snapshot.queryParamMap = convertToParamMap({ returnUrl: checkoutUrl, create: '1' });
    fixture.detectChanges();
  }

  function fillAddress(): void {
    component.addressForm.setValue({ receiverName: 'Nguyễn Văn An', receiverPhone: '0901234567',
      addressDetail: '123 Đường Test', ward: 'Phường Test', district: 'Quận Test', province: 'Hà Nội', isDefault: true });
  }

  it('automatically opens the creation form and explains the checkout handoff', () => {
    openFromCheckout();
    expect(component.showForm).toBeTrue();
    expect(component.addressForm.value.isDefault).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Lưu và tiếp tục thanh toán');
  });

  it('returns only after a successful save, preserving context and selecting the new address', () => {
    openFromCheckout(); fillAddress();
    const pending = new Subject<any>(); service.create.and.returnValue(pending);
    component.saveAddress();
    expect(navigate).not.toHaveBeenCalled();
    pending.next({ success: true, message: 'Đã lưu', data: { addressId: 42 } });
    const [url, extras] = navigate.calls.mostRecent().args;
    expect(url.queryParams).toEqual({ buyNow: '4152', qty: '2', slug: 'khan', coupon: 'SAVE10', addressId: 42 });
    expect(extras.state.checkoutDraft).toEqual(draft);
  });

  it('keeps the form and checkout context on an API failure', () => {
    openFromCheckout(); fillAddress();
    service.create.and.returnValue(throwError({ error: { message: 'Chưa lưu được địa chỉ' } }));
    component.saveAddress(); fixture.detectChanges();
    expect(component.showForm).toBeTrue();
    expect(component.saving).toBeFalse();
    expect(navigate).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.address-form-card [role=alert]').textContent).toContain('Chưa lưu được');
  });

  it('blocks invalid or duplicate submissions', () => {
    openFromCheckout(); component.saveAddress();
    expect(service.create).not.toHaveBeenCalled();
    fillAddress(); service.create.and.returnValue(new Subject<any>());
    component.saveAddress(); component.saveAddress();
    expect(service.create).toHaveBeenCalledTimes(1);
  });

  it('lets the user cancel and return without creating an address', () => {
    openFromCheckout(); component.closeForm(); component.returnToCheckout();
    expect(service.create).not.toHaveBeenCalled();
    expect(router.serializeUrl(navigate.calls.mostRecent().args[0])).toBe(checkoutUrl);
  });

  it('preserves normal standalone address creation', () => {
    fixture.detectChanges();
    expect(component.showForm).toBeFalse();
    component.openCreateForm(); fillAddress(); component.saveAddress();
    expect(service.create).toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
    expect(service.getMyAddresses).toHaveBeenCalledTimes(2);
  });

  it('rejects external or unrelated return URLs', () => {
    route.snapshot.queryParamMap = convertToParamMap({ returnUrl: 'https://example.com/checkout', create: '1' });
    fixture.detectChanges();
    expect(component.checkoutReturnUrl).toBeNull();
    expect(component.showForm).toBeFalse();
    component.returnToCheckout();
    expect(navigate).not.toHaveBeenCalled();
  });
});
