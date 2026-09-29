import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { WishlistItem } from '../../../../core/models/wishlist.model';
import { WishlistService } from '../../../../core/services/wishlist.service';

@Component({
  selector: 'app-my-wishlist',
  templateUrl: './my-wishlist.component.html',
  styleUrls: ['./my-wishlist.component.scss'],
})
export class MyWishlistComponent implements OnInit, OnDestroy {
  items: WishlistItem[] = [];

  loading = true;
  errorMessage = '';

  private wishlistSubscription?: Subscription;

  constructor(private readonly wishlistService: WishlistService) {}

  ngOnInit(): void {
    this.loadWishlist();

    // Đồng bộ danh sách hiển thị khi bấm bỏ yêu thích ngay trên product-card
    this.wishlistSubscription =
      this.wishlistService.wishlistProductIds$.subscribe((ids) => {
        this.items = this.items.filter((x) => ids.has(x.productId));
      });
  }

  ngOnDestroy(): void {
    this.wishlistSubscription?.unsubscribe();
  }

  loadWishlist(): void {
    this.loading = true;
    this.errorMessage = '';

    this.wishlistService.getWishlist().subscribe({
      next: (response) => {
        this.items = response.data || [];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Không thể tải danh sách yêu thích.';
      },
    });
  }
}
