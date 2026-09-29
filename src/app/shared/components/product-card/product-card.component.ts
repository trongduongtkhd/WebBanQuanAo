import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { PublicProduct } from '../../../core/models/catalog.model';
import { AuthService } from '../../../core/services/auth.service';
import { WishlistService } from '../../../core/services/wishlist.service';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent implements OnInit, OnDestroy {
  @Input() product!: PublicProduct;

  isFavorited = false;
  togglingWishlist = false;

  private wishlistSubscription?: Subscription;

  constructor(
    private readonly wishlistService: WishlistService,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.wishlistSubscription = this.wishlistService.wishlistProductIds$.subscribe(
      (ids) => (this.isFavorited = ids.has(this.product.productId)),
    );
  }

  ngOnDestroy(): void {
    this.wishlistSubscription?.unsubscribe();
  }

  get discountPercent(): number {
    if (!this.product.salePrice || this.product.salePrice >= this.product.basePrice) {
      return 0;
    }

    return Math.round(
      ((this.product.basePrice - this.product.salePrice) /
        this.product.basePrice) *
        100,
    );
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;

    image.src = 'assets/images/placeholders/ao-sweater.jpg';
  }

  onBrandLogoError(event: Event): void {
    const image = event.target as HTMLImageElement;

    image.style.display = 'none';
  }

  goToDetail(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    this.router.navigate(['/products', this.product.slug]);
  }

  toggleWishlist(event: Event): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });

      return;
    }

    if (this.togglingWishlist) {
      return;
    }

    this.togglingWishlist = true;

    const done = (): void => {
      this.togglingWishlist = false;
    };

    if (this.isFavorited) {
      this.wishlistService
        .removeItem(this.product.productId)
        .subscribe({ next: done, error: done });
    } else {
      this.wishlistService
        .addItem(this.product.productId)
        .subscribe({ next: done, error: done });
    }
  }
}
