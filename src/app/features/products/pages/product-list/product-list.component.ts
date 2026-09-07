import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import {
  PagedResult,
  ProductQuery,
  PublicBrand,
  PublicCategory,
  PublicProduct,
} from '../../../../core/models/catalog.model';
import { CatalogService } from '../../../../core/services/catalog.service';

interface FilterState {
  keyword: string;
  categoryId: number | null;
  brandId: number | null;
  gender: '' | 'Male' | 'Female' | 'Unisex';
  minPrice: number | null;
  maxPrice: number | null;
  sort: 'newest' | 'priceAsc' | 'priceDesc' | 'bestSelling';
}

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit {
  categories: PublicCategory[] = [];
  brands: PublicBrand[] = [];

  result: PagedResult<PublicProduct> = {
    items: [],
    page: 1,
    pageSize: 12,
    totalItems: 0,
    totalPages: 0,
  };

  filters: FilterState = {
    keyword: '',
    categoryId: null,
    brandId: null,
    gender: '',
    minPrice: null,
    maxPrice: null,
    sort: 'newest',
  };

  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly catalogService: CatalogService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.loadFilterOptions();

    this.route.queryParamMap.subscribe((params) => {
      this.filters = {
        keyword: params.get('keyword') || '',
        categoryId: this.toNumber(params.get('categoryId')),
        brandId: this.toNumber(params.get('brandId')),
        gender: (params.get('gender') as FilterState['gender']) || '',
        minPrice: this.toNumber(params.get('minPrice')),
        maxPrice: this.toNumber(params.get('maxPrice')),
        sort: (params.get('sort') as FilterState['sort']) || 'newest',
      };

      const page = this.toNumber(params.get('page')) || 1;

      this.loadProducts(page);
    });
  }

  applyFilters(): void {
    this.router.navigate(['/products'], {
      queryParams: this.buildQueryParams(1),
    });
  }

  clearFilters(): void {
    this.router.navigate(['/products']);
  }

  changePage(page: number): void {
    if (
      page < 1 ||
      page > this.result.totalPages ||
      page === this.result.page
    ) {
      return;
    }

    this.router.navigate(['/products'], {
      queryParams: this.buildQueryParams(page),
    });
  }

  private loadFilterOptions(): void {
    forkJoin({
      categories: this.catalogService.getCategories(),
      brands: this.catalogService.getBrands(),
    }).subscribe({
      next: (result) => {
        this.categories = result.categories.data;
        this.brands = result.brands.data;
      },
    });
  }

  private loadProducts(page: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    const query: ProductQuery = {
      ...this.filters,
      gender: this.filters.gender || undefined,
      categoryId: this.filters.categoryId || undefined,
      brandId: this.filters.brandId || undefined,
      minPrice: this.filters.minPrice || undefined,
      maxPrice: this.filters.maxPrice || undefined,
      page,
      pageSize: 12,
    };

    this.catalogService.getProducts(query).subscribe({
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

  private buildQueryParams(
    page: number,
  ): Record<string, string | number | null> {
    return {
      keyword: this.filters.keyword || null,
      categoryId: this.filters.categoryId,
      brandId: this.filters.brandId,
      gender: this.filters.gender || null,
      minPrice: this.filters.minPrice,
      maxPrice: this.filters.maxPrice,
      sort: this.filters.sort === 'newest' ? null : this.filters.sort,
      page: page === 1 ? null : page,
    };
  }

  private toNumber(value: string | null): number | null {
    if (!value) {
      return null;
    }

    const numberValue = Number(value);
    return Number.isNaN(numberValue) ? null : numberValue;
  }
}
