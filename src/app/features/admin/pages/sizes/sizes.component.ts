import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import {
  AdminSize,
  UpsertSizeRequest,
} from '../../../../core/models/admin.model';
import { AdminSizeService } from '../../services/admin-size.service';

@Component({
  selector: 'app-sizes',
  templateUrl: './sizes.component.html',
  styleUrls: ['./sizes.component.scss'],
})
export class SizesComponent implements OnInit {
  sizes: AdminSize[] = [];

  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  editingSizeId: number | null = null;

  form: UpsertSizeRequest = {
    sizeName: '',
    displayOrder: 1,
  };

  constructor(private readonly adminSizeService: AdminSizeService) {}

  ngOnInit(): void {
    this.loadSizes();
  }

  loadSizes(): void {
    this.isLoading = true;

    this.adminSizeService.getAll().subscribe({
      next: (response) => {
        this.sizes = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Không thể tải danh sách size.';
        this.isLoading = false;
      },
    });
  }

  submit(): void {
    if (!this.form.sizeName.trim()) {
      this.errorMessage = 'Vui lòng nhập tên size.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpsertSizeRequest = {
      sizeName: this.form.sizeName.trim().toUpperCase(),
      displayOrder: Number(this.form.displayOrder),
    };

    const request = this.editingSizeId
      ? this.adminSizeService.update(this.editingSizeId, payload)
      : this.adminSizeService.create(payload);

    request.subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.resetForm();
        this.loadSizes();
        this.isSubmitting = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage = error.error?.message || 'Không thể lưu size.';
        this.isSubmitting = false;
      },
    });
  }

  edit(size: AdminSize): void {
    this.editingSizeId = size.sizeId;

    this.form = {
      sizeName: size.sizeName,
      displayOrder: size.displayOrder,
    };

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  remove(size: AdminSize): void {
    if (!window.confirm(`Bạn có muốn xóa size "${size.sizeName}" không?`)) {
      return;
    }

    this.adminSizeService.delete(size.sizeId).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadSizes();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.error?.message ||
          'Không thể xóa size. Size có thể đang được dùng bởi biến thể.';
      },
    });
  }

  resetForm(): void {
    this.editingSizeId = null;
    this.form = {
      sizeName: '',
      displayOrder: 1,
    };
  }
}
