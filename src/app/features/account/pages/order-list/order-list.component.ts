import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OrderSummary } from '../../../../core/models/order.model';
import { CustomerOrderService } from '../../../../core/services/customer-order.service';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.scss'],
})
export class OrderListComponent implements OnInit {
  orders: OrderSummary[] = [];

  selectedStatus: number | null = null;
  page = 1;
  totalPages = 1;
  totalItems = 0;

  loading = true;
  errorMessage = '';

  readonly statuses = [
    { value: null, label: 'Tất cả đơn hàng' },
    { value: 1, label: 'Chờ xác nhận' },
    { value: 2, label: 'Đã xác nhận' },
    { value: 3, label: 'Đang giao hàng' },
    { value: 4, label: 'Hoàn thành' },
    { value: 5, label: 'Đã hủy' },
  ];

  constructor(
    private customerOrderService: CustomerOrderService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.errorMessage = '';

    this.customerOrderService
      .getMyOrders(this.selectedStatus || undefined, this.page)
      .subscribe({
        next: (response) => {
          this.orders = response.data.items || [];
          this.totalItems = response.data.totalItems || 0;
          this.totalPages = response.data.totalPages || 1;
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || 'Không thể tải danh sách đơn hàng.';
        },
      });
  }

  changeStatus(): void {
    this.page = 1;
    this.loadOrders();
  }

  viewDetail(orderId: number): void {
    this.router.navigate(['/account/orders', orderId]);
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadOrders();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadOrders();
    }
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

  getPaymentStatusText(status: number | string): string {
    const map: { [key: string]: string } = {
      '1': 'Chưa thanh toán',
      '2': 'Đã thanh toán',
      '3': 'Thanh toán thất bại',
      '4': 'Đã hoàn tiền',

      Unpaid: 'Chưa thanh toán',
      Paid: 'Đã thanh toán',
      Failed: 'Thanh toán thất bại',
      Refunded: 'Đã hoàn tiền',
    };

    return map[String(status)] || 'Không xác định';
  }
}
