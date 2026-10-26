import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  minPrice: number | null;
  maxPrice: number | null;
  sort: 'newest' | 'priceAsc' | 'priceDesc' | 'bestSelling';
}

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
})
export class ProductListComponent implements OnInit, OnDestroy {
  categories: PublicCategory[] = [];
  brands: PublicBrand[] = [];
  private readonly destroyed$ = new Subject<void>();
  private productRequest?: Subscription;
  private readonly optionsByRoot = new Map<PublicCategory, { categoryId: number; label: string }[]>();

  get selectedRootCategory(): PublicCategory | undefined {
    return this.categories.find((category) =>
      this.containsCategory(category, this.filters.categoryId),
    );
  }

  get subcategoryOptions(): { categoryId: number; label: string }[] {
    const root = this.selectedRootCategory;
    if (!root) {
      return [];
    }
    const cached = this.optionsByRoot.get(root);
    if (cached) {
      return cached;
    }

    const collect = (
      categories: PublicCategory[],
      parentPath = '',
    ): { categoryId: number; label: string }[] =>
      categories.reduce<{ categoryId: number; label: string }[]>((options, category) => {
        const label = parentPath
          ? `${parentPath} / ${category.categoryName}`
          : category.categoryName;
        return options.concat(
          { categoryId: category.categoryId, label },
          collect(category.children, label),
        );
      }, []);

    const options = collect(root.children);
    this.optionsByRoot.set(root, options);
    return options;
  }

  get selectedSubcategoryId(): number | null {
    return this.filters.categoryId === this.selectedRootCategory?.categoryId
      ? null
      : this.filters.categoryId;
  }

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

    this.route.queryParamMap.pipe(takeUntil(this.destroyed$)).subscribe((params) => {
      this.filters = {
        keyword: params.get('keyword') || '',
        categoryId: this.toNumber(params.get('categoryId')),
        brandId: this.toNumber(params.get('brandId')),
        minPrice: this.toNumber(params.get('minPrice')),
        maxPrice: this.toNumber(params.get('maxPrice')),
        sort: (params.get('sort') as FilterState['sort']) || 'newest',
      };

      const page = this.toNumber(params.get('page')) || 1;
      if (params.has('gender')) {
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { gender: null },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        });
      }

      this.loadProducts(page);
    });
  }

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.destroyed$.complete();
    this.productRequest?.unsubscribe();
  }

  onRootCategoryChange(categoryId: number | null): void {
    this.filters.categoryId = categoryId;
  }

  onSubcategoryChange(categoryId: number | null): void {
    this.filters.categoryId = categoryId ?? this.selectedRootCategory?.categoryId ?? null;
  }

  applyFilters(): void {
    this.router.navigate(['/products'], {
      queryParams: this.buildQueryParams(1),
    });
  }

  clearFilters(): void {
    this.router.navigate(['/products']);
  }

  onBrandLogoError(event: Event): void {
    const image = event.target as HTMLImageElement;

    image.style.display = 'none';
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
    }).pipe(takeUntil(this.destroyed$)).subscribe({
      next: (result) => {
        this.categories = result.categories.data;
        this.brands = result.brands.data;
      },
    });
  }

  private loadProducts(page: number): void {
    this.productRequest?.unsubscribe();
    this.isLoading = true;
    this.errorMessage = '';

    const query: ProductQuery = {
      ...this.filters,
      categoryId: this.filters.categoryId || undefined,
      brandId: this.filters.brandId || undefined,
      minPrice: this.filters.minPrice ?? undefined,
      maxPrice: this.filters.maxPrice ?? undefined,
      page,
      pageSize: 12,
    };

    this.productRequest = this.catalogService.getProducts(query).subscribe({
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

  private containsCategory(category: PublicCategory, categoryId: number | null): boolean {
    return category.categoryId === categoryId ||
      category.children.some((child) => this.containsCategory(child, categoryId));
  }

  private buildQueryParams(
    page: number,
  ): Record<string, string | number | null> {
    return {
      keyword: this.filters.keyword || null,
      categoryId: this.filters.categoryId,
      brandId: this.filters.brandId,
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
