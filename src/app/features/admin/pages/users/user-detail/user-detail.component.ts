import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminUser } from '../../../../../core/models/admin-user.model';
import { AdminUserService } from '../../../services/admin-user.service';

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
})
export class UserDetailComponent implements OnInit {
  user: AdminUser | null = null;

  loading = true;
  changingStatus = false;

  errorMessage = '';
  successMessage = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private adminUserService: AdminUserService,
  ) {}

  ngOnInit(): void {
    const userId = Number(this.route.snapshot.paramMap.get('id'));

    if (!userId) {
      this.loading = false;
      this.errorMessage = 'Mã người dùng không hợp lệ.';
      return;
    }

    this.loadUser(userId);
  }

  loadUser(userId: number): void {
    this.loading = true;

    this.adminUserService.getById(userId).subscribe({
      next: (response) => {
        this.user = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Không thể tải thông tin người dùng.';
      },
    });
  }

  toggleStatus(): void {
    if (!this.user) {
      return;
    }

    const nextStatus = !this.user.isActive;
    const action = nextStatus ? 'mở khóa' : 'khóa';

    if (!window.confirm(`Bạn có muốn ${action} tài khoản này?`)) {
      return;
    }

    this.changingStatus = true;

    this.adminUserService.updateStatus(this.user.userId, nextStatus).subscribe({
      next: (response) => {
        this.user!.isActive = nextStatus;
        this.changingStatus = false;
        this.successMessage = response.message;
      },
      error: (error) => {
        this.changingStatus = false;
        this.errorMessage =
          error?.error?.message || 'Không thể cập nhật tài khoản.';
      },
    });
  }

  getInitials(): string {
    if (!this.user) {
      return 'U';
    }

    return this.user.fullName
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((x) => x.charAt(0))
      .join('')
      .toUpperCase();
  }

  onAvatarError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.style.display = 'none';
  }

  goBack(): void {
    this.router.navigate(['/admin/users']);
  }
}
