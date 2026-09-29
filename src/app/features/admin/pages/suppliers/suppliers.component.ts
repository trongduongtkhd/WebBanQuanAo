import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';

import {
  AdminSupplier,
  UpsertSupplierRequest,
} from '../../../../core/models/admin.model';
import { AdminSupplierService } from '../../services/admin-supplier.service';

@Component({
  selector: 'app-suppliers',
  templateUrl: './suppliers.component.html',
  styleUrls: ['./suppliers.component.scss'],
})
export class SuppliersComponent implements OnInit {
  suppliers: AdminSupplier[] = [];

  isLoading = false;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  editingSupplierId: number | null = null;

  form: UpsertSupplierRequest = this.createEmptyForm();

  constructor(private readonly adminSupplierService: AdminSupplierService) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminSupplierService.getAll().subscribe({
      next: (response) => {
        this.suppliers = response.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Không thể tải danh sách nhà cung ứng.';
        this.isLoading = false;
      },
    });
  }

  submit(): void {
    if (!this.form.supplierName.trim()) {
      this.errorMessage = 'Vui lòng nhập tên nhà cung ứng.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload: UpsertSupplierRequest = {
      supplierName: this.form.supplierName.trim(),
      contactName: this.form.contactName?.trim() || null,
      phone: this.form.phone?.trim() || null,
      email: this.form.email?.trim() || null,
      address: this.form.address?.trim() || null,
      taxCode: this.form.taxCode?.trim() || null,
      description: this.form.description?.trim() || null,
      isActive: this.form.isActive,
    };

    const request = this.editingSupplierId
      ? this.adminSupplierService.update(this.editingSupplierId, payload)
      : this.adminSupplierService.create(payload);

    request.subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.resetForm();
        this.loadSuppliers();
        this.isSubmitting = false;
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.error?.message || 'Không thể lưu nhà cung ứng.';
        this.isSubmitting = false;
      },
    });
  }

  edit(supplier: AdminSupplier): void {
    this.editingSupplierId = supplier.supplierId;

    this.form = {
      supplierName: supplier.supplierName,
      contactName: supplier.contactName || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxCode: supplier.taxCode || '',
      description: supplier.description || '',
      isActive: supplier.isActive,
    };

    this.errorMessage = '';
    this.successMessage = '';

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  remove(supplier: AdminSupplier): void {
    const accepted = window.confirm(
      `Bạn có muốn ẩn nhà cung ứng "${supplier.supplierName}" không?`,
    );

    if (!accepted) {
      return;
    }

    this.adminSupplierService.delete(supplier.supplierId).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.loadSuppliers();
      },
      error: (error: HttpErrorResponse) => {
        this.errorMessage =
          error.error?.message || 'Không thể ẩn nhà cung ứng.';
      },
    });
  }

  resetForm(): void {
    this.editingSupplierId = null;
    this.form = this.createEmptyForm();
  }

  private createEmptyForm(): UpsertSupplierRequest {
    return {
      supplierName: '',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      taxCode: '',
      description: '',
      isActive: true,
    };
  }
}
