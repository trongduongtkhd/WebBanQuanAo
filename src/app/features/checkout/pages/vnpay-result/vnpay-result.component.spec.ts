import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { VnpayService, VnpayStatus } from '../../../../core/services/vnpay.service';
import { VnpayResultComponent } from './vnpay-result.component';

describe('VNPAY return result', () => {
  let fixture: ComponentFixture<VnpayResultComponent>;
  let service: jasmine.SpyObj<VnpayService>;
  const status = (attemptStatus: string, paymentStatus = 'Failed'): VnpayStatus => ({
    orderId: 8011, orderCode: 'DH-TEST', amount: 180000, attemptStatus, paymentStatus,
    transactionCode: null, paidAt: null, expiresAt: null, canPay: paymentStatus !== 'Paid',
    canCancel: paymentStatus !== 'Paid', requiresReview: false, message: 'Kết quả đã xác minh',
  });
  beforeEach(async () => {
    service = jasmine.createSpyObj('VnpayService', ['status', 'reconcile', 'createPaymentUrl', 'redirectToPayment']);
    await TestBed.configureTestingModule({
      declarations: [VnpayResultComponent], imports: [CommonModule, RouterTestingModule],
      providers: [
        { provide: VnpayService, useValue: service },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ orderId: '8011' }) } } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(VnpayResultComponent);
  });
  it('shows cancellation without calling QUERYDR', fakeAsync(() => {
    service.status.and.returnValue(of({ data: status('Cancelled') } as any));
    fixture.detectChanges(); tick(0); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Bạn đã hủy thanh toán');
    expect(fixture.nativeElement.textContent).not.toContain('Đang xác minh thanh toán');
    expect(service.reconcile).not.toHaveBeenCalled(); fixture.destroy();
  }));
  it('shows verified success immediately and stops polling', fakeAsync(() => {
    service.status.and.returnValue(of({ data: status('Succeeded', 'Paid') } as any));
    fixture.detectChanges(); tick(0); fixture.detectChanges(); tick(15000);
    expect(fixture.nativeElement.textContent).toContain('Thanh toán thành công');
    expect(service.status).toHaveBeenCalledTimes(1);
    expect(service.reconcile).not.toHaveBeenCalled(); fixture.destroy();
  }));
  it('polls pending status until a verified result arrives', fakeAsync(() => {
    service.status.and.returnValues(of({ data: status('Pending', 'Unpaid') } as any), of({ data: status('Succeeded', 'Paid') } as any));
    fixture.detectChanges(); tick(0); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Đang xác minh thanh toán');
    tick(3000); fixture.detectChanges(); tick(10000);
    expect(fixture.nativeElement.textContent).toContain('Thanh toán thành công');
    expect(service.status).toHaveBeenCalledTimes(2); fixture.destroy();
  }));
});
