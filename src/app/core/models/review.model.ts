export interface AdminReview {
  reviewId: number;

  productId: number;
  productName: string;

  userId: number;
  userFullName: string;
  userEmail: string;

  orderItemId?: number | null;

  rating: number;
  comment?: string | null;

  isApproved: boolean;
  createdAt: string;
}

export interface CreateReviewRequest {
  orderItemId: number;
  rating: number;
  comment?: string | null;
}

export interface PublicReview {
  reviewId: number;
  userFullName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface MyReview {
  reviewId: number;

  productId: number;
  productName: string;

  orderItemId?: number | null;

  rating: number;
  comment?: string | null;

  isApproved: boolean;
  createdAt: string;
}

export interface UpdateReviewRequest {
  rating: number;
  comment?: string | null;
}
