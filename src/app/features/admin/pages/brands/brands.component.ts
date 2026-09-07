import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import {
  AdminBrand,
  UpsertBrandRequest,
} from '../../../../core/models/admin.model';
import { AdminBrandService } from '../../services/admin-brand.service';

@Component({
  selector: 'app-brands',
  templateUrl: './brands.component.html',
  styleUrls: ['./brands.component.scss'],
})
export class BrandsComponent implements OnInit {
  brands: AdminBrand[] = [];

  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  editingBrandId: number | null = null;

  form: UpsertBrandRequest = this.createEmptyForm();

  constructor(private readonly adminBrandService: AdminBrandService) {}

  ngOnInit(): void {
    this.loadBrands();
  }

  loadBrands(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminBrandService.getAll().subscribe({
      next: (response) => {
        this.brands = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Không thể tải danh sách thương hiệu.';
        this.isLoading = false;
      },
    });
  }

  submit(): void {
    if (!this.form.brandName.trim()) {
      this.errorMessage = 'Vui lòng nhập tên thương hiệu.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpsertBrandRequest = {
      brandName: this.form.brandName.trim(),
      description: this.form.description?.trim() || null,
      logoUrl: this.form.logoUrl?.trim() || null,
      isActive: this.form.isActive,
    };

    const request = this.editingBrandId
      ? this.adminBrandService.update(this.editingBrandId, payload)
      : this.adminBrandService.create(payload);

    request.subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.resetForm();
        this.loadBrands();
        this.isSubmitting = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.error?.message || 'Không thể lưu thương hiệu.';
        this.isSubmitting = false;
      },
    });
  }

  edit(brand: AdminBrand): void {
    this.editingBrandId = brand.brandId;

    this.form = {
      brandName: brand.brandName,
      description: brand.description || '',
      logoUrl: brand.logoUrl || '',
      isActive: brand.isActive,
    };

    this.errorMessage = '';
    this.successMessage = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  remove(brand: AdminBrand): void {
    const accepted = window.confirm(
      `Bạn có muốn ẩn thương hiệu "${brand.brandName}" không?`,
    );

    if (!accepted) {
      return;
    }

    this.adminBrandService.delete(brand.brandId).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadBrands();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Không thể ẩn thương hiệu.';
      },
    });
  }

  resetForm(): void {
    this.editingBrandId = null;
    this.form = this.createEmptyForm();
  }

  private createEmptyForm(): UpsertBrandRequest {
    return {
      brandName: '',
      description: '',
      logoUrl: '',
      isActive: true,
    };
  }

  onBrandImageUploaded(imageUrl: string): void {
    this.form.logoUrl = imageUrl;
  }
}
