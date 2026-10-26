import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { PublicCategory } from '../../../../core/models/catalog.model';
import { CatalogService } from '../../../../core/services/catalog.service';
import { ProductListComponent } from './product-list.component';
import { ImageUrlPipe } from '../../../../shared/pipes/image-url.pipe';

describe('ProductListComponent category filters', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let catalog: jasmine.SpyObj<CatalogService>;
  let router: jasmine.SpyObj<Router>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  const category = (categoryId: number, categoryName: string, children: PublicCategory[] = []): PublicCategory =>
    ({ categoryId, categoryName, slug: String(categoryId), children });
  const categories = [
    category(1, 'Nam', [category(2, 'Áo Nam', [category(6, 'Áo Mùa Đông')]), category(5, 'Quần Nam')]),
    category(3, 'Nữ'),
  ];
  const response = (data: any) => ({ success: true, message: '', data });
  const emptyResult = { items: [], page: 1, pageSize: 12, totalItems: 0, totalPages: 0 };

  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({}));
    catalog = jasmine.createSpyObj('CatalogService', ['getCategories', 'getBrands', 'getProducts']);
    catalog.getCategories.and.returnValue(of(response(categories)));
    catalog.getBrands.and.returnValue(of(response([])));
    catalog.getProducts.and.returnValue(of(response(emptyResult)));
    router = jasmine.createSpyObj('Router', ['navigate']);
    await TestBed.configureTestingModule({
      declarations: [ProductListComponent, ImageUrlPipe],
      imports: [FormsModule],
      providers: [
        { provide: CatalogService, useValue: catalog },
        { provide: ActivatedRoute, useValue: { queryParamMap: params } },
        { provide: Router, useValue: router },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => fixture.destroy());

  it('shows all root categories and hides subcategories when no category is selected', () => {
    fixture.detectChanges();
    const root: HTMLSelectElement = fixture.nativeElement.querySelector('#category-filter');
    expect(Array.from(root.options).map(option => option.textContent?.trim())).toEqual(['Tất cả danh mục', 'Nam', 'Nữ']);
    expect(fixture.nativeElement.querySelector('#subcategory-filter')).toBeNull();
  });

  it('restores parent and child from a homepage link, including deeper descendants', async () => {
    params.next(convertToParamMap({ categoryId: '6', gender: 'Male' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root: HTMLSelectElement = fixture.nativeElement.querySelector('#category-filter');
    const child: HTMLSelectElement = fixture.nativeElement.querySelector('#subcategory-filter');
    expect(root.selectedOptions[0].textContent?.trim()).toBe('Nam');
    expect(child.selectedOptions[0].textContent?.trim()).toBe('Áo Nam / Áo Mùa Đông');
    expect(child.textContent).toContain('Tất cả trong Nam');
    expect(catalog.getProducts).toHaveBeenCalledWith(jasmine.objectContaining({ categoryId: 6 }));
    expect(catalog.getProducts.calls.mostRecent().args[0].gender).toBeUndefined();
  });

  it('restores the category selection even when filter options arrive after URL parameters', () => {
    const options = new Subject<any>();
    catalog.getCategories.and.returnValue(options);
    params.next(convertToParamMap({ categoryId: '2' }));
    fixture.detectChanges();
    expect(component.selectedRootCategory).toBeUndefined();
    options.next(response(categories));
    options.complete();
    fixture.detectChanges();
    expect(component.selectedRootCategory?.categoryId).toBe(1);
    expect(component.selectedSubcategoryId).toBe(2);
  });

  it('resets the child when changing root while preserving brand and price filters', () => {
    params.next(convertToParamMap({ categoryId: '2', gender: 'Female', brandId: '9', minPrice: '100' }));
    fixture.detectChanges();
    component.onRootCategoryChange(3);
    expect(component.filters.categoryId).toBe(3);
    expect(component.selectedSubcategoryId).toBeNull();
    expect(component.subcategoryOptions).toEqual([]);
    expect(component.filters.brandId).toBe(9);
    expect(component.filters.minPrice).toBe(100);
    component.onRootCategoryChange(null);
    expect(component.filters.categoryId).toBeNull();
  });

  it('selects a child and can return to all products in its root', () => {
    params.next(convertToParamMap({ categoryId: '1' }));
    fixture.detectChanges();
    component.onSubcategoryChange(5);
    expect(component.filters.categoryId).toBe(5);
    component.onSubcategoryChange(null);
    expect(component.filters.categoryId).toBe(1);
    expect(component.selectedSubcategoryId).toBeNull();
  });

  it('applies the child and combined filters on page one and retains them for pagination', () => {
    params.next(convertToParamMap({ categoryId: '1', page: '3', gender: 'Unisex', brandId: '9', minPrice: '0', maxPrice: '500000', keyword: 'Áo', sort: 'priceAsc' }));
    fixture.detectChanges();
    component.onSubcategoryChange(2);
    component.applyFilters();
    const expected = { categoryId: 2, brandId: 9, minPrice: 0, maxPrice: 500000, keyword: 'Áo', sort: 'priceAsc', page: null };
    expect(router.navigate).toHaveBeenCalledWith(['/products'], { queryParams: expected });
    component.result = { ...emptyResult, page: 1, totalItems: 30, totalPages: 3 };
    component.changePage(2);
    expect(router.navigate).toHaveBeenCalledWith(['/products'], { queryParams: { ...expected, page: 2 } });
  });

  it('keeps a zero price boundary in API requests', () => {
    params.next(convertToParamMap({ categoryId: '1', minPrice: '0', maxPrice: '0' }));
    fixture.detectChanges();
    expect(catalog.getProducts).toHaveBeenCalledWith(jasmine.objectContaining({ categoryId: 1, minPrice: 0, maxPrice: 0 }));
  });

  it('restores the previous selection on browser navigation and clears all filters', () => {
    params.next(convertToParamMap({ categoryId: '2', gender: 'Male' }));
    fixture.detectChanges();
    params.next(convertToParamMap({ categoryId: '3' }));
    expect(component.selectedRootCategory?.categoryId).toBe(3);
    params.next(convertToParamMap({ categoryId: '2', gender: 'Male' }));
    expect(component.selectedRootCategory?.categoryId).toBe(1);
    expect(component.selectedSubcategoryId).toBe(2);
    component.clearFilters();
    expect(router.navigate).toHaveBeenCalledWith(['/products']);
    params.next(convertToParamMap({}));
    expect(component.selectedRootCategory).toBeUndefined();
  });

  it('removes gender from the UI and cleans legacy URLs without filtering products by gender', () => {
    params.next(convertToParamMap({ categoryId: '1', gender: 'Female', minPrice: '100' }));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain('Giới tính');
    expect(catalog.getProducts.calls.mostRecent().args[0].gender).toBeUndefined();
    expect(catalog.getProducts.calls.mostRecent().args[0].categoryId).toBe(1);
    expect(router.navigate).toHaveBeenCalledWith([], jasmine.objectContaining({
      queryParams: { gender: null }, queryParamsHandling: 'merge', replaceUrl: true,
    }));
  });

  it('cancels outdated requests so a slow response cannot replace the current filter results', () => {
    const previous = new Subject<any>();
    const current = new Subject<any>();
    catalog.getProducts.and.returnValues(previous, current);
    fixture.detectChanges();
    params.next(convertToParamMap({ categoryId: '2' }));
    current.next(response({ ...emptyResult, totalItems: 5 }));
    previous.next(response({ ...emptyResult, totalItems: 99 }));
    expect(component.result.totalItems).toBe(5);
  });
});
