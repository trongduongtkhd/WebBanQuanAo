import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Coupon, CouponDiscountType } from '../../../../../core/models/coupon.model';
import { AdminCouponService } from '../../../services/admin-coupon.service';
import { AdminCategoryService } from '../../../services/admin-category.service';
import { AdminProductService } from '../../../services/admin-product.service';
import { CouponFormComponent } from './coupon-form.component';

describe('CouponFormComponent', () => {
  let component: CouponFormComponent;
  let service: jasmine.SpyObj<AdminCouponService>;

  function coupon(discountType: CouponDiscountType, discountValue = 10, maxDiscountAmount: number | null = 70000): Coupon {
    return { couponId: 1, code: 'NU10', name: 'Ưu đãi', discountType,
      discountValue, maxDiscountAmount, minOrderAmount: 10000,
      startDate: '2026-10-20T08:54:00Z', endDate: '2026-11-25T08:54:00Z',
      usedCount: 1, isActive: true, categoryIds: [1], productIds: [] };
  }

  beforeEach(() => {
    service = jasmine.createSpyObj('AdminCouponService', ['update']);
    service.update.and.returnValue(of({ success: true, message: 'Đã lưu', data: coupon('Percentage') }));
    component = new CouponFormComponent(new FormBuilder(), {} as ActivatedRoute,
      jasmine.createSpyObj('Router', ['navigate']), service, {} as AdminCategoryService, {} as AdminProductService);
    component.couponId = 1;
  });

  ['Percentage', 1, '1'].forEach(type => {
    it(`loads percentage type ${type} and preserves 10% and its cap when saving`, () => {
      component.fillForm(coupon(type as CouponDiscountType));
      expect(component.couponForm.get('discountType')?.value).toBe(1);
      expect(component.isPercentage).toBeTrue();
      component.save();
      expect(service.update).toHaveBeenCalledTimes(1);
      expect(service.update.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({
        discountType: 1, discountValue: 10, maxDiscountAmount: 70000, categoryIds: [1],
      }));
    });
  });

  ['FixedAmount', 2, '2'].forEach(type => {
    it(`loads fixed type ${type} and preserves the money discount when saving`, () => {
      component.fillForm(coupon(type as CouponDiscountType, 30000, null));
      expect(component.couponForm.get('discountType')?.value).toBe(2);
      expect(component.isPercentage).toBeFalse();
      component.save();
      expect(service.update.calls.mostRecent().args[1]).toEqual(jasmine.objectContaining({
        discountType: 2, discountValue: 30000, maxDiscountAmount: null,
      }));
    });
  });

  it('blocks an unknown API discount type instead of silently saving it as money', () => {
    component.fillForm(coupon('Unknown' as CouponDiscountType));
    component.save();
    expect(service.update).not.toHaveBeenCalled();
    expect(component.couponForm.get('discountType')?.invalid).toBeTrue();
  });
});
