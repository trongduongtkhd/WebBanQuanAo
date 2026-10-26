import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { Coupon, CouponDiscountType } from '../../../../../core/models/coupon.model';
import { AdminCouponService } from '../../../services/admin-coupon.service';

import { CouponListComponent } from './coupon-list.component';

describe('CouponListComponent', () => {
  let component: CouponListComponent;
  let fixture: ComponentFixture<CouponListComponent>;

  function coupon(discountType: CouponDiscountType, discountValue = 10): Coupon {
    return { couponId: 1, code: 'NU10', name: 'Giảm giá phần trăm', discountType,
      discountValue, maxDiscountAmount: 70000, minOrderAmount: 10000,
      startDate: '2026-10-20T08:54:00Z', endDate: '2026-11-25T08:54:00Z',
      usedCount: 1, isActive: true, categoryIds: [1], productIds: [] };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule],
      declarations: [CouponListComponent],
      providers: [
        { provide: AdminCouponService, useValue: { getAll: () => of({ data: [coupon('Percentage')] }) } },
        { provide: Router, useValue: jasmine.createSpyObj('Router', ['navigate']) },
      ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CouponListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the actual API Percentage response as 10% with its maximum discount', () => {
    const row: HTMLElement = fixture.nativeElement.querySelector('tbody tr');
    expect(row.querySelectorAll('td')[2].textContent).toContain('10%');
    expect(row.querySelectorAll('td')[2].textContent).toContain('Tối đa');
    expect(row.querySelectorAll('td')[2].textContent).toContain('70,000');
    expect(row.querySelectorAll('td')[2].textContent).not.toContain('10 ₫');
  });

  [1, '1'].forEach(type => {
    it(`also renders a numeric percentage type ${type} correctly`, () => {
      component.coupons = [coupon(type as CouponDiscountType)]; fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('tbody tr td:nth-child(3)').textContent).toContain('10%');
    });
  });

  ['FixedAmount', 2, '2'].forEach(type => {
    it(`keeps fixed money discounts in dong for type ${type}`, () => {
      component.coupons = [coupon(type as CouponDiscountType, 30000)]; fixture.detectChanges();
      const cell: HTMLElement = fixture.nativeElement.querySelector('tbody tr td:nth-child(3)');
      expect(cell.textContent).toContain('30.000 ₫');
      expect(cell.textContent).not.toContain('%');
      expect(cell.textContent).not.toContain('Tối đa');
    });
  });
});
