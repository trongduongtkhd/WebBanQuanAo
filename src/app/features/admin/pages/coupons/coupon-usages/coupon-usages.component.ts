import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CouponUsage } from '../../../../../core/models/coupon.model';
import { AdminCouponService } from '../../../services/admin-coupon.service';

@Component({
  selector: 'app-coupon-usages',
  templateUrl: './coupon-usages.component.html',
  styleUrls: ['./coupon-usages.component.scss'],
})
export class CouponUsagesComponent implements OnInit {
  couponId = 0;
  usages: CouponUsage[] = [];

  page = 1;
  totalPages = 1;
  totalItems = 0;

  loading = true;
  errorMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminCouponService: AdminCouponService,
  ) {}

  ngOnInit(): void {
    this.couponId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadUsages();
  }

  loadUsages(): void {
    this.loading = true;

    this.adminCouponService.getUsages(this.couponId, this.page).subscribe({
      next: (response) => {
        this.usages = response.data.items || [];
        this.totalPages = response.data.totalPages || 1;
        this.totalItems = response.data.totalItems || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Không thể tải lịch sử sử dụng coupon.';
      },
    });
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadUsages();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadUsages();
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/coupons']);
  }
}
