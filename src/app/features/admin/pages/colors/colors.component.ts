import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import {
  AdminColor,
  UpsertColorRequest,
} from '../../../../core/models/admin.model';
import { AdminColorService } from '../../services/admin-color.service';

@Component({
  selector: 'app-colors',
  templateUrl: './colors.component.html',
  styleUrls: ['./colors.component.scss'],
})
export class ColorsComponent implements OnInit {
  colors: AdminColor[] = [];

  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  editingColorId: number | null = null;

  form: UpsertColorRequest = {
    colorName: '',
    colorCode: '#000000',
  };

  constructor(private readonly adminColorService: AdminColorService) {}

  ngOnInit(): void {
    this.loadColors();
  }

  loadColors(): void {
    this.isLoading = true;

    this.adminColorService.getAll().subscribe({
      next: (response) => {
        this.colors = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Không thể tải danh sách màu sắc.';
        this.isLoading = false;
      },
    });
  }

  submit(): void {
    if (!this.form.colorName.trim()) {
      this.errorMessage = 'Vui lòng nhập tên màu.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpsertColorRequest = {
      colorName: this.form.colorName.trim(),
      colorCode: this.form.colorCode || null,
    };

    const request = this.editingColorId
      ? this.adminColorService.update(this.editingColorId, payload)
      : this.adminColorService.create(payload);

    request.subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.resetForm();
        this.loadColors();
        this.isSubmitting = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Không thể lưu màu sắc.';
        this.isSubmitting = false;
      },
    });
  }

  edit(color: AdminColor): void {
    this.editingColorId = color.colorId;

    this.form = {
      colorName: color.colorName,
      colorCode: color.colorCode || '#000000',
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  remove(color: AdminColor): void {
    if (!window.confirm(`Bạn có muốn xóa màu "${color.colorName}" không?`)) {
      return;
    }

    this.adminColorService.delete(color.colorId).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadColors();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.error?.message ||
          'Không thể xóa màu. Màu có thể đang được dùng bởi biến thể sản phẩm.';
      },
    });
  }

  resetForm(): void {
    this.editingColorId = null;
    this.form = {
      colorName: '',
      colorCode: '#000000',
    };
  }
}
