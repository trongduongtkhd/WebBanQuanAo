import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import {
  AdminProductList,
  AdminProductVariant,
} from '../../../../../core/models/admin.model';
import { PagedResult } from '../../../../../core/models/catalog.model';
import { AdminProductService } from '../../../services/admin-product.service';

@Component({
  selector: 'app-product-list-admin',
  templateUrl: './product-list-admin.component.html',
  styleUrls: ['./product-list-admin.component.scss'],
})
export class ProductListAdminComponent implements OnInit {
  result: PagedResult<AdminProductList> = {
    items: [],
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  };

  keyword = '';
  isActive: '' | 'true' | 'false' = '';

  isLoading = false;
  errorMessage = '';
  successMessage = '';

  expandedProductId: number | null = null;
  variantsByProduct = new Map<number, AdminProductVariant[]>();
  loadingVariantsFor: number | null = null;

  constructor(private readonly adminProductService: AdminProductService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  getProfit(
    product: AdminProductList,
  ): { amount: number; percent: number } | null {
    if (!product.averageCostPrice) {
      return null;
    }

    const sellingPrice = product.salePrice || product.basePrice;

    if (!sellingPrice) {
      return null;
    }

    const amount = sellingPrice - product.averageCostPrice;

    return {
      amount,
      percent: (amount / sellingPrice) * 100,
    };
  }

  loadProducts(page = 1): void {
    this.isLoading = true;
    this.errorMessage = '';

    const status = this.isActive === '' ? undefined : this.isActive === 'true';

    this.adminProductService.getAll(this.keyword, status, page, 10).subscribe({
      next: (response) => {
        this.result = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Không thể tải danh sách sản phẩm.';
        this.isLoading = false;
      },
    });
  }

  search(): void {
    this.loadProducts(1);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.result.totalPages) {
      return;
    }

    this.loadProducts(page);
  }

  remove(product: AdminProductList): void {
    const accepted = window.confirm(
      `Bạn có muốn ẩn sản phẩm "${product.productName}" không?`,
    );

    if (!accepted) {
      return;
    }

    this.adminProductService.delete(product.productId).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadProducts(this.result.page);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Không thể ẩn sản phẩm.';
      },
    });
  }

  restore(product: AdminProductList): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.adminProductService.getById(product.productId).subscribe({
      next: (detailResponse) => {
        const detail = detailResponse.data;

        this.adminProductService
          .update(product.productId, {
            categoryId: detail.categoryId,
            brandId: detail.brandId,
            productName: detail.productName,
            shortDescription: detail.shortDescription,
            description: detail.description,
            material: detail.material,
            gender: detail.gender,
            basePrice: detail.basePrice,
            salePrice: detail.salePrice,
            isFeatured: detail.isFeatured,
            isActive: true,
          })
          .subscribe({
            next: (response) => {
              this.successMessage = response.message;
              this.loadProducts(this.result.page);
            },
            error: (error: HttpErrorResponse) => {
              this.errorMessage =
                error.error?.message || 'Không thể hiện lại sản phẩm.';
            },
          });
      },
      error: () => {
        this.errorMessage = 'Không thể tải thông tin sản phẩm.';
      },
    });
  }

  toggleVariants(product: AdminProductList): void {
    if (this.expandedProductId === product.productId) {
      this.expandedProductId = null;
      return;
    }

    this.expandedProductId = product.productId;

    if (this.variantsByProduct.has(product.productId)) {
      return;
    }

    this.loadingVariantsFor = product.productId;

    this.adminProductService.getById(product.productId).subscribe({
      next: (response) => {
        this.variantsByProduct.set(product.productId, response.data.variants);
        this.loadingVariantsFor = null;
      },
      error: () => {
        this.loadingVariantsFor = null;
        this.errorMessage = 'Không thể tải danh sách biến thể.';
      },
    });
  }

  getVariantProfit(
    variant: AdminProductVariant,
  ): { amount: number; percent: number } | null {
    if (!variant.averageCostPrice) {
      return null;
    }

    const sellingPrice = variant.salePrice || variant.price;

    if (!sellingPrice) {
      return null;
    }

    const amount = sellingPrice - variant.averageCostPrice;

    return {
      amount,
      percent: (amount / sellingPrice) * 100,
    };
  }

  getPageNumbers(): number[] {
    return Array.from(
      { length: this.result.totalPages },
      (_, index) => index + 1,
    );
  }
}
