import { Component, OnInit } from '@angular/core';
import { Dashboard } from '../../../../core/models/dashboard.model';
import { AdminDashboardService } from '../../services/admin-dashboard.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  dashboard: Dashboard | null = null;

  fromDate = '';
  toDate = '';

  loading = true;
  errorMessage = '';

  constructor(private adminDashboardService: AdminDashboardService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminDashboardService
      .getDashboard(this.fromDate || undefined, this.toDate || undefined)
      .subscribe({
        next: (response) => {
          this.dashboard = response.data;
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || 'Không thể tải dữ liệu dashboard.';
        },
      });
  }

  applyDateFilter(): void {
    if (this.fromDate && this.toDate && this.fromDate > this.toDate) {
      this.errorMessage = 'Ngày bắt đầu không được sau ngày kết thúc.';
      return;
    }

    this.loadDashboard();
  }

  resetDateFilter(): void {
    this.fromDate = '';
    this.toDate = '';
    this.loadDashboard();
  }

  setThisMonth(): void {
    const today = new Date();

    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(today);

    this.loadDashboard();
  }

  getOrderStatusText(status: number | string): string {
    const map: { [key: string]: string } = {
      '1': 'Chờ xác nhận',
      '2': 'Đã xác nhận',
      '3': 'Đang giao hàng',
      '4': 'Hoàn thành',
      '5': 'Đã hủy',

      Pending: 'Chờ xác nhận',
      Confirmed: 'Đã xác nhận',
      Shipping: 'Đang giao hàng',
      Completed: 'Hoàn thành',
      Cancelled: 'Đã hủy',
    };

    return map[String(status)] || 'Không xác định';
  }

  getOrderStatusClass(status: number | string): string {
    const map: { [key: string]: string } = {
      '1': 'warning',
      '2': 'info',
      '3': 'primary',
      '4': 'success',
      '5': 'danger',

      Pending: 'warning',
      Confirmed: 'info',
      Shipping: 'primary',
      Completed: 'success',
      Cancelled: 'danger',
    };

    return map[String(status)] || 'secondary';
  }

  getStockClass(stockQuantity: number): string {
    if (stockQuantity <= 0) {
      return 'danger';
    }

    if (stockQuantity <= 5) {
      return 'warning';
    }

    return 'success';
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
