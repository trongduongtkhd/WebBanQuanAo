import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import {
  AdminBrand,
  AdminCategory,
  AdminColor,
  AdminProductDetail,
  AdminProductVariant,
  AdminSize,
  Gender,
  UpsertProductImageRequest,
  UpsertProductRequest,
  UpsertProductVariantRequest,
} from '../../../../../core/models/admin.model';
import { AdminBrandService } from '../../../services/admin-brand.service';
import { AdminCategoryService } from '../../../services/admin-category.service';
import { AdminColorService } from '../../../services/admin-color.service';
import { AdminProductService } from '../../../services/admin-product.service';
import { AdminSizeService } from '../../../services/admin-size.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.scss'],
})
export class ProductFormComponent implements OnInit {
  productId: number | null = null;
  product: AdminProductDetail | null = null;

  categories: AdminCategory[] = [];
  brands: AdminBrand[] = [];
  colors: AdminColor[] = [];
  sizes: AdminSize[] = [];

  isLoading = false;
  isSavingProduct = false;
  isSavingVariant = false;
  isSavingImage = false;

  errorMessage = '';
  successMessage = '';

  editingVariantId: number | null = null;

  productForm: UpsertProductRequest = this.createEmptyProductForm();

  variantForm: UpsertProductVariantRequest = this.createEmptyVariantForm();

  imageForm: UpsertProductImageRequest = {
    imageUrl: '',
    displayOrder: 1,
    isThumbnail: false,
  };

  readonly genders: { value: Gender; label: string }[] = [
    { value: 'Male', label: 'Nam' },
    { value: 'Female', label: 'Nữ' },
    { value: 'Unisex', label: 'Unisex' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly adminProductService: AdminProductService,
    private readonly adminCategoryService: AdminCategoryService,
    private readonly adminBrandService: AdminBrandService,
    private readonly adminColorService: AdminColorService,
    private readonly adminSizeService: AdminSizeService,
  ) {}

  ngOnInit(): void {
    this.loadOptions();

    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.productId = id;
      this.loadProduct();
    }
  }

  saveProduct(): void {
    if (
      !this.productForm.categoryId ||
      !this.productForm.productName.trim() ||
      !this.productForm.description.trim()
    ) {
      this.errorMessage =
        'Vui lòng nhập đầy đủ danh mục, tên và mô tả sản phẩm.';
      return;
    }

    if (
      this.productForm.salePrice &&
      this.productForm.salePrice > this.productForm.basePrice
    ) {
      this.errorMessage = 'Giá giảm không được lớn hơn giá gốc.';
      return;
    }

    this.isSavingProduct = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpsertProductRequest = {
      ...this.productForm,
      productName: this.productForm.productName.trim(),
      shortDescription: this.productForm.shortDescription?.trim() || null,
      description: this.productForm.description.trim(),
      material: this.productForm.material?.trim() || null,
      brandId: this.productForm.brandId || null,
      basePrice: Number(this.productForm.basePrice),
      salePrice: this.productForm.salePrice
        ? Number(this.productForm.salePrice)
        : null,
    };

    const request = this.productId
      ? this.adminProductService.update(this.productId, payload)
      : this.adminProductService.create(payload);

    request.subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isSavingProduct = false;

        if (!this.productId) {
          this.router.navigate([
            '/admin/products',
            response.data.productId,
            'edit',
          ]);

          return;
        }

        this.product = response.data;
        this.assignProductForm(response.data);
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Không thể lưu sản phẩm.';
        this.isSavingProduct = false;
      },
    });
  }

  saveVariant(): void {
    if (!this.productId) {
      return;
    }

    if (
      !this.variantForm.colorId ||
      !this.variantForm.sizeId ||
      !this.variantForm.sku.trim()
    ) {
      this.errorMessage = 'Vui lòng chọn màu, size và nhập SKU.';
      return;
    }

    if (
      this.variantForm.salePrice &&
      this.variantForm.salePrice > this.variantForm.price
    ) {
      this.errorMessage = 'Giá giảm biến thể không được lớn hơn giá gốc.';
      return;
    }

    this.isSavingVariant = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpsertProductVariantRequest = {
      ...this.variantForm,
      colorId: Number(this.variantForm.colorId),
      sizeId: Number(this.variantForm.sizeId),
      sku: this.variantForm.sku.trim().toUpperCase(),
      price: Number(this.variantForm.price),
      salePrice: this.variantForm.salePrice
        ? Number(this.variantForm.salePrice)
        : null,
      stockQuantity: Number(this.variantForm.stockQuantity),
      imageUrl: this.variantForm.imageUrl?.trim() || null,
    };

    const request = this.editingVariantId
      ? this.adminProductService.updateVariant(
          this.productId,
          this.editingVariantId,
          payload,
        )
      : this.adminProductService.createVariant(this.productId, payload);

    request.subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isSavingVariant = false;
        this.resetVariantForm();
        this.loadProduct();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Không thể lưu biến thể.';
        this.isSavingVariant = false;
      },
    });
  }

  saveImage(): void {
    if (!this.productId || !this.imageForm.imageUrl.trim()) {
      this.errorMessage = 'Vui lòng nhập đường dẫn ảnh.';
      return;
    }

    this.isSavingImage = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpsertProductImageRequest = {
      imageUrl: this.imageForm.imageUrl.trim(),
      displayOrder: Number(this.imageForm.displayOrder),
      isThumbnail: this.imageForm.isThumbnail,
    };

    this.adminProductService.createImage(this.productId, payload).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isSavingImage = false;

        this.imageForm = {
          imageUrl: '',
          displayOrder: this.imageForm.displayOrder + 1,
          isThumbnail: false,
        };

        this.loadProduct();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Không thể thêm ảnh.';
        this.isSavingImage = false;
      },
    });
  }

  editVariant(variant: AdminProductVariant): void {
    this.editingVariantId = variant.variantId;

    this.variantForm = {
      colorId: variant.colorId,
      sizeId: variant.sizeId,
      sku: variant.sku,
      price: variant.price,
      salePrice: variant.salePrice || null,
      stockQuantity: variant.stockQuantity,
      imageUrl: variant.imageUrl || null,
      isActive: variant.isActive,
    };

    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }

  deleteVariant(variant: AdminProductVariant): void {
    if (!this.productId) {
      return;
    }

    if (!window.confirm(`Bạn có muốn ẩn biến thể ${variant.sku} không?`)) {
      return;
    }

    this.adminProductService
      .deleteVariant(this.productId, variant.variantId)
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.loadProduct();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage = error.error?.message || 'Không thể ẩn biến thể.';
        },
      });
  }

  deleteImage(imageId: number): void {
    if (!this.productId || !window.confirm('Bạn có muốn xóa ảnh này không?')) {
      return;
    }

    this.adminProductService.deleteImage(this.productId, imageId).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadProduct();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Không thể xóa ảnh.';
      },
    });
  }

  resetVariantForm(): void {
    this.editingVariantId = null;
    this.variantForm = this.createEmptyVariantForm();
  }

  private loadOptions(): void {
    forkJoin({
      categories: this.adminCategoryService.getAll(),
      brands: this.adminBrandService.getAll(),
      colors: this.adminColorService.getAll(),
      sizes: this.adminSizeService.getAll(),
    }).subscribe({
      next: (response) => {
        this.categories = response.categories.data.filter(
          (category) => category.isActive,
        );

        this.brands = response.brands.data.filter((brand) => brand.isActive);

        this.colors = response.colors.data;
        this.sizes = response.sizes.data;
      },
      error: () => {
        this.errorMessage = 'Không thể tải dữ liệu danh mục, màu hoặc size.';
      },
    });
  }

  private loadProduct(): void {
    if (!this.productId) {
      return;
    }

    this.isLoading = true;

    this.adminProductService.getById(this.productId).subscribe({
      next: (response) => {
        this.product = response.data;
        this.assignProductForm(response.data);

        this.imageForm.displayOrder = response.data.images.length + 1;

        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Không thể tải chi tiết sản phẩm.';
        this.isLoading = false;
      },
    });
  }

  private assignProductForm(product: AdminProductDetail): void {
    this.productForm = {
      categoryId: product.categoryId,
      brandId: product.brandId || null,
      productName: product.productName,
      shortDescription: product.shortDescription || '',
      description: product.description,
      material: product.material || '',
      gender: product.gender,
      basePrice: product.basePrice,
      salePrice: product.salePrice || null,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
    };
  }

  private createEmptyProductForm(): UpsertProductRequest {
    return {
      categoryId: 0,
      brandId: null,
      productName: '',
      shortDescription: '',
      description: '',
      material: '',
      gender: 'Unisex',
      basePrice: 0,
      salePrice: null,
      isFeatured: false,
      isActive: true,
    };
  }

  private createEmptyVariantForm(): UpsertProductVariantRequest {
    return {
      colorId: 0,
      sizeId: 0,
      sku: '',
      price: 0,
      salePrice: null,
      stockQuantity: 0,
      imageUrl: null,
      isActive: true,
    };
  }
  onProductImageUploaded(imageUrl: string): void {
    this.imageForm.imageUrl = imageUrl;
  }

  onVariantImageUploaded(imageUrl: string): void {
    this.variantForm.imageUrl = imageUrl;
  }
}
