import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import { AdminProductList } from '../../../../../core/models/admin.model';
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

  constructor(private readonly adminProductService: AdminProductService) {}

  ngOnInit(): void {
    this.loadProducts();
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

  getPageNumbers(): number[] {
    return Array.from(
      { length: this.result.totalPages },
      (_, index) => index + 1,
    );
  }
}
