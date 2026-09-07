import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { forkJoin, of } from 'rxjs';

import {
  AdminCategory,
  AdminProductList,
} from '../../../../../core/models/admin.model';
import {
  Coupon,
  UpsertCouponRequest,
} from '../../../../../core/models/coupon.model';

import { AdminCategoryService } from '../../../services/admin-category.service';
import { AdminProductService } from '../../../services/admin-product.service';
import { AdminCouponService } from '../../../services/admin-coupon.service';

@Component({
  selector: 'app-coupon-form',
  templateUrl: './coupon-form.component.html',
  styleUrls: ['./coupon-form.component.scss'],
})
export class CouponFormComponent implements OnInit {
  couponId: number | null = null;
  loading = true;
  saving = false;
  errorMessage = '';

  categories: AdminCategory[] = [];
  products: AdminProductList[] = [];

  selectedCategoryIds: number[] = [];
  selectedProductIds: number[] = [];

  couponForm = this.fb.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', Validators.maxLength(500)],

    discountType: [1, Validators.required],
    discountValue: [null, [Validators.required, Validators.min(0.01)]],
    maxDiscountAmount: [null],
    minOrderAmount: [0, [Validators.required, Validators.min(0)]],

    startDate: ['', Validators.required],
    endDate: ['', Validators.required],

    usageLimit: [null],
    usageLimitPerUser: [null],
    isActive: [true],
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private adminCouponService: AdminCouponService,
    private adminCategoryService: AdminCategoryService,
    private adminProductService: AdminProductService,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.couponId = id || null;

    this.loadInitialData();
  }

  loadInitialData(): void {
    forkJoin({
      categories: this.adminCategoryService.getAll(),

      products: this.adminProductService.getAll(),

      coupon: this.couponId
        ? this.adminCouponService.getById(this.couponId)
        : of(null),
    }).subscribe({
      next: ({ categories, products, coupon }) => {
        this.categories = categories.data || [];
        this.products = products.data?.items || [];

        if (coupon) {
          this.fillForm(coupon.data);
        } else {
          this.setDefaultDates();
        }

        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Không thể tải dữ liệu coupon.';
      },
    });
  }

  setDefaultDates(): void {
    const now = new Date();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    this.couponForm.patchValue({
      startDate: this.toDateTimeLocal(now),
      endDate: this.toDateTimeLocal(nextMonth),
    });
  }

  fillForm(coupon: Coupon): void {
    this.selectedCategoryIds = coupon.categoryIds || [];
    this.selectedProductIds = coupon.productIds || [];

    this.couponForm.patchValue({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',

      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscountAmount: coupon.maxDiscountAmount,
      minOrderAmount: coupon.minOrderAmount,

      startDate: this.toDateTimeLocal(coupon.startDate),
      endDate: this.toDateTimeLocal(coupon.endDate),

      usageLimit: coupon.usageLimit,
      usageLimitPerUser: coupon.usageLimitPerUser,
      isActive: coupon.isActive,
    });
  }

  get isPercentage(): boolean {
    return Number(this.couponForm.get('discountType')?.value) === 1;
  }

  toggleCategory(categoryId: number): void {
    this.selectedCategoryIds = this.toggleId(
      this.selectedCategoryIds,
      categoryId,
    );
  }

  toggleProduct(productId: number): void {
    this.selectedProductIds = this.toggleId(this.selectedProductIds, productId);
  }

  isCategorySelected(categoryId: number): boolean {
    return this.selectedCategoryIds.includes(categoryId);
  }

  isProductSelected(productId: number): boolean {
    return this.selectedProductIds.includes(productId);
  }

  save(): void {
    this.errorMessage = '';

    if (this.couponForm.invalid) {
      this.couponForm.markAllAsTouched();
      return;
    }

    const formValue = this.couponForm.value;

    if (new Date(formValue.endDate!) <= new Date(formValue.startDate!)) {
      this.errorMessage = 'Ngày kết thúc phải sau ngày bắt đầu.';
      return;
    }

    const request: UpsertCouponRequest = {
      code: formValue.code!.trim().toUpperCase(),
      name: formValue.name!.trim(),
      description: formValue.description?.trim() || null,

      discountType: Number(formValue.discountType),
      discountValue: Number(formValue.discountValue),
      maxDiscountAmount: formValue.maxDiscountAmount
        ? Number(formValue.maxDiscountAmount)
        : null,

      minOrderAmount: Number(formValue.minOrderAmount || 0),

      startDate: formValue.startDate!,
      endDate: formValue.endDate!,

      usageLimit: formValue.usageLimit ? Number(formValue.usageLimit) : null,

      usageLimitPerUser: formValue.usageLimitPerUser
        ? Number(formValue.usageLimitPerUser)
        : null,

      isActive: !!formValue.isActive,

      categoryIds: this.selectedCategoryIds,
      productIds: this.selectedProductIds,
    };

    this.saving = true;

    const request$ = this.couponId
      ? this.adminCouponService.update(this.couponId, request)
      : this.adminCouponService.create(request);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/admin/coupons']);
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Không thể lưu coupon.';
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/admin/coupons']);
  }

  private toggleId(list: number[], id: number): number[] {
    return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  }

  private toDateTimeLocal(value: string | Date): string {
    return String(value).substring(0, 16);
  }
}
