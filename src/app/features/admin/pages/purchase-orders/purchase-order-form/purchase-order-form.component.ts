import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import {
  AdminProductList,
  AdminProductVariant,
  AdminSupplier,
  CreatePurchaseOrderItemRequest,
} from '../../../../../core/models/admin.model';
import { AdminProductService } from '../../../services/admin-product.service';
import { AdminPurchaseOrderService } from '../../../services/admin-purchase-order.service';
import { AdminSupplierService } from '../../../services/admin-supplier.service';

interface PurchaseOrderLine extends CreatePurchaseOrderItemRequest {
  productName: string;
  colorName: string;
  sizeName: string;
  sku: string;
}

@Component({
  selector: 'app-purchase-order-form',
  templateUrl: './purchase-order-form.component.html',
  styleUrls: ['./purchase-order-form.component.scss'],
})
export class PurchaseOrderFormComponent implements OnInit {
  suppliers: AdminSupplier[] = [];
  supplierId: number | null = null;
  note = '';

  searchKeyword = '';
  searchResults: AdminProductList[] = [];
  isSearching = false;

  selectedProductVariants: AdminProductVariant[] = [];
  selectedProductName = '';
  selectedProductId: number | null = null;

  lines: PurchaseOrderLine[] = [];

  // Có giá trị khi đang sửa phiếu (route purchase-orders/:id/edit).
  purchaseOrderId: number | null = null;
  purchaseOrderCode = '';
  isLoading = false;

  isSubmitting = false;
  errorMessage = '';

  constructor(
    private readonly supplierService: AdminSupplierService,
    private readonly productService: AdminProductService,
    private readonly purchaseOrderService: AdminPurchaseOrderService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  get isEditMode(): boolean {
    return this.purchaseOrderId !== null;
  }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.purchaseOrderId = Number(idParam);
      this.loadPurchaseOrder(this.purchaseOrderId);
    }

    this.supplierService.getAll().subscribe({
      next: (response) => {
        this.suppliers = response.data;
      },
    });
  }

  // Khi sửa, vẫn hiển thị nhà cung ứng hiện tại của phiếu dù đã ngừng hoạt động.
  get supplierOptions(): AdminSupplier[] {
    return this.suppliers.filter(
      (x) => x.isActive || x.supplierId === this.supplierId,
    );
  }

  private loadPurchaseOrder(id: number): void {
    this.isLoading = true;

    this.purchaseOrderService.getById(id).subscribe({
      next: (response) => {
        const purchaseOrder = response.data;
        this.isLoading = false;

        if (purchaseOrder.status === 'Cancelled') {
          this.errorMessage = 'Phiếu nhập kho đã bị hủy, không thể sửa.';
          return;
        }

        this.purchaseOrderCode = purchaseOrder.purchaseOrderCode;
        this.supplierId = purchaseOrder.supplierId;
        this.note = purchaseOrder.note ?? '';
        this.lines = purchaseOrder.items.map((x) => ({
          variantId: x.variantId,
          productName: x.productName,
          colorName: x.colorName,
          sizeName: x.sizeName,
          sku: x.sku,
          quantity: x.quantity,
          unitCost: x.unitCost,
        }));
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Không thể tải phiếu nhập kho.';
      },
    });
  }

  get totalAmount(): number {
    return this.lines.reduce((sum, x) => sum + x.quantity * x.unitCost, 0);
  }

  searchProducts(): void {
    if (!this.searchKeyword.trim()) {
      this.searchResults = [];
      return;
    }

    this.isSearching = true;

    this.productService.getAll(this.searchKeyword, undefined, 1, 8).subscribe({
      next: (response) => {
        this.searchResults = response.data.items;
        this.isSearching = false;
      },
      error: () => {
        this.isSearching = false;
      },
    });
  }

  selectProduct(product: AdminProductList): void {
    this.selectedProductName = product.productName;
    this.selectedProductId = product.productId;
    this.selectedProductVariants = [];

    this.productService.getById(product.productId).subscribe({
      next: (response) => {
        this.selectedProductVariants = response.data.variants.filter(
          (x) => x.isActive,
        );
      },
    });
  }

  addLine(variant: AdminProductVariant): void {
    const existing = this.lines.find((x) => x.variantId === variant.variantId);

    if (existing) {
      this.errorMessage = 'Biến thể này đã có trong phiếu nhập.';
      return;
    }

    this.errorMessage = '';

    this.lines.push({
      variantId: variant.variantId,
      productName: this.selectedProductName,
      colorName: variant.colorName,
      sizeName: variant.sizeName,
      sku: variant.sku,
      quantity: 1,
      unitCost: variant.price,
    });
  }

  removeLine(index: number): void {
    this.lines.splice(index, 1);
  }

  submit(): void {
    this.errorMessage = '';

    if (!this.supplierId) {
      this.errorMessage = 'Vui lòng chọn nhà cung ứng.';
      return;
    }

    if (this.lines.length === 0) {
      this.errorMessage = 'Vui lòng thêm ít nhất 1 sản phẩm vào phiếu nhập.';
      return;
    }

    const invalidLine = this.lines.find(
      (x) => x.quantity <= 0 || x.unitCost < 0,
    );

    if (invalidLine) {
      this.errorMessage = 'Số lượng phải lớn hơn 0 và đơn giá không được âm.';
      return;
    }

    this.isSubmitting = true;

    const payload = {
      supplierId: this.supplierId,
      note: this.note.trim() || null,
      items: this.lines.map((x) => ({
        variantId: x.variantId,
        quantity: x.quantity,
        unitCost: x.unitCost,
      })),
    };

    const request$ = this.purchaseOrderId
      ? this.purchaseOrderService.update(this.purchaseOrderId, payload)
      : this.purchaseOrderService.create(payload);

    request$.subscribe({
        next: (response) => {
          this.isSubmitting = false;
          this.router.navigate([
            '/admin/purchase-orders',
            response.data.purchaseOrderId,
          ]);
        },
        error: (error: HttpErrorResponse) => {
          this.isSubmitting = false;
          this.errorMessage =
            error.error?.message ||
            (this.isEditMode
              ? 'Không thể cập nhật phiếu nhập kho.'
              : 'Không thể tạo phiếu nhập kho.');
        },
      });
  }
}
