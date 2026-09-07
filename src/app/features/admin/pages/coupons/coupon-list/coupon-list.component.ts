import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Coupon } from '../../../../../core/models/coupon.model';
import { AdminCouponService } from '../../../services/admin-coupon.service';

@Component({
  selector: 'app-coupon-list',
  templateUrl: './coupon-list.component.html',
  styleUrls: ['./coupon-list.component.scss'],
})
export class CouponListComponent implements OnInit {
  coupons: Coupon[] = [];

  loading = true;
  errorMessage = '';
  changingCouponId: number | null = null;

  constructor(
    private adminCouponService: AdminCouponService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCoupons();
  }

  loadCoupons(): void {
    this.loading = true;

    this.adminCouponService.getAll().subscribe({
      next: (response) => {
        this.coupons = response.data || [];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Không thể tải danh sách mã giảm giá.';
      },
    });
  }

  getDiscountText(coupon: Coupon): string {
    if (coupon.discountType === 1) {
      return `${coupon.discountValue}%`;
    }

    return `${coupon.discountValue.toLocaleString('vi-VN')} ₫`;
  }

  getCouponState(coupon: Coupon): string {
    const now = new Date();
    const startDate = new Date(coupon.startDate);
    const endDate = new Date(coupon.endDate);

    if (!coupon.isActive) {
      return 'Đã tắt';
    }

    if (now < startDate) {
      return 'Chưa diễn ra';
    }

    if (now > endDate) {
      return 'Đã hết hạn';
    }

    return 'Đang hoạt động';
  }

  getStateClass(coupon: Coupon): string {
    const state = this.getCouponState(coupon);

    if (state === 'Đang hoạt động') {
      return 'success';
    }

    if (state === 'Chưa diễn ra') {
      return 'warning';
    }

    return 'secondary';
  }

  toggleStatus(coupon: Coupon): void {
    this.changingCouponId = coupon.couponId;

    this.adminCouponService
      .updateStatus(coupon.couponId, !coupon.isActive)
      .subscribe({
        next: () => {
          coupon.isActive = !coupon.isActive;
          this.changingCouponId = null;
        },
        error: (error) => {
          this.changingCouponId = null;
          this.errorMessage =
            error?.error?.message || 'Không thể cập nhật trạng thái coupon.';
        },
      });
  }

  goToCreate(): void {
    this.router.navigate(['/admin/coupons/create']);
  }

  goToEdit(couponId: number): void {
    this.router.navigate(['/admin/coupons', couponId, 'edit']);
  }

  goToUsages(couponId: number): void {
    this.router.navigate(['/admin/coupons', couponId, 'usages']);
  }
}
