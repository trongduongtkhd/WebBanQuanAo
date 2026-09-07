import { Component, OnInit } from '@angular/core';
import { MyReview } from '../../../../core/models/review.model';
import { ReviewService } from '../../../../core/services/review.service';

@Component({
  selector: 'app-my-reviews',
  templateUrl: './my-reviews.component.html',
  styleUrls: ['./my-reviews.component.scss'],
})
export class MyReviewsComponent implements OnInit {
  reviews: MyReview[] = [];

  page = 1;
  totalPages = 1;
  totalItems = 0;

  loading = true;
  saving = false;
  deletingReviewId: number | null = null;

  showEditForm = false;
  editingReview: MyReview | null = null;

  editRating = 5;
  editComment = '';

  errorMessage = '';
  successMessage = '';

  constructor(private reviewService: ReviewService) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading = true;

    this.reviewService.getMyReviews(this.page).subscribe({
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

  openEditForm(review: MyReview): void {
    this.editingReview = review;
    this.editRating = review.rating;
    this.editComment = review.comment || '';

    this.errorMessage = '';
    this.successMessage = '';
    this.showEditForm = true;
  }

  closeEditForm(): void {
    if (this.saving) {
      return;
    }

    this.showEditForm = false;
    this.editingReview = null;
  }

  updateReview(): void {
    if (!this.editingReview) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';

    this.reviewService
      .update(this.editingReview.reviewId, {
        rating: this.editRating,
        comment: this.editComment.trim() || null,
      })
      .subscribe({
        next: (response) => {
          this.saving = false;
          this.successMessage = response.message;
          this.showEditForm = false;
          this.loadReviews();
        },
        error: (error) => {
          this.saving = false;
          this.errorMessage =
            error?.error?.message || 'Không thể cập nhật đánh giá.';
        },
      });
  }

  deleteReview(review: MyReview): void {
    const confirmed = window.confirm(
      `Bạn có muốn xóa đánh giá cho "${review.productName}" không?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingReviewId = review.reviewId;
    this.errorMessage = '';

    this.reviewService.delete(review.reviewId).subscribe({
      next: (response) => {
        this.deletingReviewId = null;
        this.successMessage = response.message;
        this.loadReviews();
      },
      error: (error) => {
        this.deletingReviewId = null;
        this.errorMessage = error?.error?.message || 'Không thể xóa đánh giá.';
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
}
