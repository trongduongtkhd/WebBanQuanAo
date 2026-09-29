import { Component, OnInit } from '@angular/core';

import {
  AdminSupplier,
  PurchaseOrderListItem,
} from '../../../../../core/models/admin.model';
import { PagedResult } from '../../../../../core/models/catalog.model';
import { AdminPurchaseOrderService } from '../../../services/admin-purchase-order.service';
import { AdminSupplierService } from '../../../services/admin-supplier.service';

@Component({
  selector: 'app-purchase-order-list',
  templateUrl: './purchase-order-list.component.html',
  styleUrls: ['./purchase-order-list.component.scss'],
})
export class PurchaseOrderListComponent implements OnInit {
  result: PagedResult<PurchaseOrderListItem> = {
    items: [],
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  };

  suppliers: AdminSupplier[] = [];
  selectedSupplierId: number | null = null;

  isLoading = false;
  errorMessage = '';

  constructor(
    private readonly purchaseOrderService: AdminPurchaseOrderService,
    private readonly supplierService: AdminSupplierService,
  ) {}

  ngOnInit(): void {
    this.supplierService.getAll().subscribe({
      next: (response) => (this.suppliers = response.data),
    });

    this.loadPurchaseOrders(1);
  }

  loadPurchaseOrders(page: number): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.purchaseOrderService
      .getAll(this.selectedSupplierId, page, this.result.pageSize)
      .subscribe({
        next: (response) => {
          this.result = response.data;
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Không thể tải danh sách phiếu nhập kho.';
          this.isLoading = false;
        },
      });
  }

  onFilterChange(): void {
    this.loadPurchaseOrders(1);
  }

  changePage(page: number): void {
    if (page < 1 || page > this.result.totalPages || page === this.result.page) {
      return;
    }

    this.loadPurchaseOrders(page);
  }
}
