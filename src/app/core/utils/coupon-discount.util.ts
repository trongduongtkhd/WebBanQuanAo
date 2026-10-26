import { CouponDiscountType } from '../models/coupon.model';

export function normalizeCouponDiscountType(value: CouponDiscountType): 1 | 2 | null {
  switch (value) {
    case 1: case '1': case 'Percentage': return 1;
    case 2: case '2': case 'FixedAmount': return 2;
    default: return null;
  }
}

export function formatCouponDiscount(value: number, type: CouponDiscountType): string {
  const normalized = normalizeCouponDiscountType(type);
  if (normalized === 1) { return `${value.toLocaleString('vi-VN')}%`; }
  if (normalized === 2) { return `${value.toLocaleString('vi-VN')} ₫`; }
  return 'Không xác định';
}
