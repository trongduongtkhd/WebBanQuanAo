import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AvailableCoupon } from '../../../../core/models/coupon.model';
import { CustomerCouponService } from '../../../../core/services/customer-coupon.service';

@Component({
  selector: 'app-my-coupons',
  templateUrl: './my-coupons.component.html',
  styleUrls: ['./my-coupons.component.scss'],
})
export class MyCouponsComponent implements OnInit {
  coupons: AvailableCoupon[] = [];

  loading = true;
  errorMessage = '';
  copiedCode = '';

  constructor(
    private customerCouponService: CustomerCouponService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.loading = true;
    this.errorMessage = '';

    this.customerCouponService.getAvailableCoupons().subscribe({
      next: (response) => {
        this.coupons = response.data || [];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Không thể tải danh sách ưu đãi.';
      },
    });
  }

  getDiscountText(coupon: AvailableCoupon): string {
    if (coupon.discountType === 1 || coupon.discountType === 'Percentage') {
      return `Giảm ${coupon.discountValue}%`;
    }

    return `Giảm ${coupon.discountValue.toLocaleString('vi-VN')} ₫`;
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(
      () => {
        this.copiedCode = code;

        window.setTimeout(() => {
          this.copiedCode = '';
        }, 2000);
      },
      () => {
        this.errorMessage = 'Không thể sao chép mã. Bạn hãy sao chép thủ công.';
      },
    );
  }

  useCoupon(coupon: AvailableCoupon): void {
    if (!coupon.isUsable) {
      return;
    }

    this.router.navigate(['/checkout'], {
      queryParams: {
        coupon: coupon.code,
      },
    });
  }
}
