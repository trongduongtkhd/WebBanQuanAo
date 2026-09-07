import { Component, OnInit } from '@angular/core';
import { AdminReview } from '../../../../../core/models/review.model';
import { AdminReviewService } from '../../../services/admin-review.service';

@Component({
  selector: 'app-review-list',
  templateUrl: './review-list.component.html',
  styleUrls: ['./review-list.component.scss'],
})
export class ReviewListComponent implements OnInit {
  reviews: AdminReview[] = [];

  keyword = '';
  selectedApproval: string = 'all';

  page = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;

  loading = true;
  errorMessage = '';
  processingReviewId: number | null = null;

  constructor(private adminReviewService: AdminReviewService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;
    this.errorMessage = '';

    this.adminReviewService
      .getAll({
        keyword: this.keyword,
        isApproved: this.getApprovalFilter(),
        page: this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (response) => {
          this.reviews = response.data.items || [];
          this.totalItems = response.data.totalItems || 0;
          this.totalPages = response.data.totalPages || 1;
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error?.error?.message || 'Không thể tải danh sách đánh giá.';
        },
      });
  }

  search(): void {
    this.page = 1;
    this.loadReviews();
  }

  approve(review: AdminReview): void {
    this.processingReviewId = review.reviewId;

    this.adminReviewService.approve(review.reviewId).subscribe({
      next: () => {
        review.isApproved = true;
        this.processingReviewId = null;
      },
      error: (error) => {
        this.processingReviewId = null;
        this.errorMessage =
          error?.error?.message || 'Không thể duyệt đánh giá.';
      },
    });
  }

  reject(review: AdminReview): void {
    const confirmed = window.confirm('Bạn muốn ẩn hoặc từ chối đánh giá này?');

    if (!confirmed) {
      return;
    }

    this.processingReviewId = review.reviewId;

    this.adminReviewService.reject(review.reviewId).subscribe({
      next: () => {
        review.isApproved = false;
        this.processingReviewId = null;
      },
      error: (error) => {
        this.processingReviewId = null;
        this.errorMessage =
          error?.error?.message || 'Không thể cập nhật đánh giá.';
      },
    });
  }

  previousPage(): void {
    if (this.page > 1) {
      this.page--;
      this.loadReviews();
    }
  }

  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadReviews();
    }
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }

  private getApprovalFilter(): boolean | undefined {
    if (this.selectedApproval === 'approved') {
      return true;
    }

    if (this.selectedApproval === 'pending') {
      return false;
    }

    return undefined;
  }
}
