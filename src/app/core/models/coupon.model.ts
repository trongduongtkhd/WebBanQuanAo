export interface Coupon {
  couponId: number;

  code: string;
  name: string;
  description?: string | null;

  // DiscountType: Percentage = 1, FixedAmount = 2
  discountType: number;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;

  startDate: string;
  endDate: string;

  usageLimit?: number | null;
  usageLimitPerUser?: number | null;
  usedCount: number;

  isActive: boolean;

  categoryIds: number[];
  productIds: number[];
}

export interface UpsertCouponRequest {
  code: string;
  name: string;
  description?: string | null;

  discountType: number;
  discountValue: number;
  maxDiscountAmount?: number | null;
  minOrderAmount: number;

  startDate: string;
  endDate: string;

  usageLimit?: number | null;
  usageLimitPerUser?: number | null;

  isActive: boolean;

  categoryIds: number[];
  productIds: number[];
}

export interface CouponUsage {
  couponUsageId: number;
  userId: number;
  userFullName: string;
  userEmail: string;

  orderId: number;
  orderCode: string;

  discountAmount: number;
  usedAt: string;
}
