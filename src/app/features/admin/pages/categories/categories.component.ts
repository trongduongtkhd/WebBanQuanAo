import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import {
  AdminCategory,
  UpsertCategoryRequest,
} from '../../../../core/models/admin.model';
import { AdminCategoryService } from '../../services/admin-category.service';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss'],
})
export class CategoriesComponent implements OnInit {
  categories: AdminCategory[] = [];

  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  editingCategoryId: number | null = null;

  form: UpsertCategoryRequest = this.createEmptyForm();

  constructor(private readonly adminCategoryService: AdminCategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminCategoryService.getAll().subscribe({
      next: (response) => {
        this.categories = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Không thể tải danh sách danh mục.';
        this.isLoading = false;
      },
    });
  }

  submit(): void {
    if (!this.form.categoryName.trim()) {
      this.errorMessage = 'Vui lòng nhập tên danh mục.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpsertCategoryRequest = {
      parentCategoryId: this.form.parentCategoryId || null,
      categoryName: this.form.categoryName.trim(),
      description: this.form.description?.trim() || null,
      imageUrl: this.form.imageUrl?.trim() || null,
      isActive: this.form.isActive,
    };

    const request = this.editingCategoryId
      ? this.adminCategoryService.update(this.editingCategoryId, payload)
      : this.adminCategoryService.create(payload);

    request.subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.resetForm();
        this.loadCategories();
        this.isSubmitting = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Không thể lưu danh mục.';
        this.isSubmitting = false;
      },
    });
  }

  edit(category: AdminCategory): void {
    this.editingCategoryId = category.categoryId;

    this.form = {
      parentCategoryId: category.parentCategoryId || null,
      categoryName: category.categoryName,
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      isActive: category.isActive,
    };

    this.successMessage = '';
    this.errorMessage = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  remove(category: AdminCategory): void {
    const accepted = window.confirm(
      `Bạn có muốn ẩn danh mục "${category.categoryName}" không?`,
    );

    if (!accepted) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    this.adminCategoryService.delete(category.categoryId).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadCategories();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Không thể xóa danh mục.';
      },
    });
  }

  resetForm(): void {
    this.editingCategoryId = null;
    this.form = this.createEmptyForm();
  }

  canSelectAsParent(category: AdminCategory): boolean {
    return category.categoryId !== this.editingCategoryId;
  }

  private createEmptyForm(): UpsertCategoryRequest {
    return {
      parentCategoryId: null,
      categoryName: '',
      description: '',
      imageUrl: '',
      isActive: true,
    };
  }

  onCategoryImageUploaded(imageUrl: string): void {
    this.form.imageUrl = imageUrl;
  }
}
