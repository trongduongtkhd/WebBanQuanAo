import { Component, OnInit } from '@angular/core';
import { AdminUser } from '../../../../../core/models/admin-user.model';
import { AdminUserService } from '../../../services/admin-user.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit {
  users: AdminUser[] = [];

  keyword = '';
  selectedRole = '';
  selectedStatus = 'all';

  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;

  loading = true;
  errorMessage = '';
  successMessage = '';

  changingUserId: number | null = null;

  constructor(
    private adminUserService: AdminUserService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminUserService
      .getAll({
        keyword: this.keyword,
        role: this.selectedRole || undefined,
        isActive: this.getStatusFilter(),
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (response) => {
          this.users = response.data.items || [];
          this.totalItems = response.data.totalItems || 0;
          this.totalPages = response.data.totalPages || 1;
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || 'Không thể tải danh sách người dùng.';
        },
      });
  }

  search(): void {
    this.page = 1;
    this.loadUsers();
  }

  resetFilters(): void {
    this.keyword = '';
    this.selectedRole = '';
    this.selectedStatus = 'all';
    this.page = 1;
    this.loadUsers();
  }

  toggleStatus(user: AdminUser): void {
    const nextStatus = !user.isActive;

    const action = nextStatus ? 'mở khóa' : 'khóa';

    const confirmed = window.confirm(
      `Bạn có chắc muốn ${action} tài khoản "${user.fullName}"?`,
    );

    if (!confirmed) {
      return;
    }

    this.changingUserId = user.userId;
    this.successMessage = '';
    this.errorMessage = '';

    this.adminUserService.updateStatus(user.userId, nextStatus).subscribe({
      next: (response) => {
        user.isActive = nextStatus;
        this.changingUserId = null;
        this.successMessage = response.message;
      },
      error: (error) => {
        this.changingUserId = null;
        this.errorMessage =
          error?.error?.message || 'Không thể cập nhật trạng thái tài khoản.';
      },
    });
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadUsers();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadUsers();
    }
  }

  getInitials(fullName: string): string {
    return fullName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((item) => item.charAt(0))
      .join('')
      .toUpperCase();
  }

  private getStatusFilter(): boolean | undefined {
    if (this.selectedStatus === 'active') {
      return true;
    }

    if (this.selectedStatus === 'locked') {
      return false;
    }

    return undefined;
  }

  viewDetail(userId: number): void {
    this.router.navigate(['/admin/users', userId]);
  }
}
