import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Cart, CartItem } from '../../../../core/models/cart.model';
import { CartService } from '../../../../core/services/cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss'],
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;

  loading = true;
  errorMessage = '';
  successMessage = '';

  updatingItemId: number | null = null;
  removingItemId: number | null = null;
  clearing = false;

  constructor(
    private cartService: CartService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this.errorMessage = '';

    this.cartService.getCart().subscribe({
      next: (response) => {
        this.cart = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error?.error?.message || 'Không thể tải giỏ hàng.';
      },
    });
  }

  decreaseQuantity(item: CartItem): void {
    if (item.quantity > 1) {
      this.updateQuantity(item, item.quantity - 1);
    }
  }

  increaseQuantity(item: CartItem): void {
    if (item.quantity < item.stockQuantity) {
      this.updateQuantity(item, item.quantity + 1);
    }
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity < 1 || quantity > item.stockQuantity) {
      return;
    }

    this.updatingItemId = item.cartItemId;
    this.errorMessage = '';

    this.cartService.updateItem(item.cartItemId, { quantity }).subscribe({
      next: (response) => {
        this.cart = response.data;
        this.updatingItemId = null;
      },
      error: (error) => {
        this.updatingItemId = null;
        this.errorMessage =
          error?.error?.message || 'Không thể cập nhật số lượng.';
      },
    });
  }

  removeItem(item: CartItem): void {
    const confirmed = window.confirm(
      `Bạn có muốn xóa "${item.productName}" khỏi giỏ hàng không?`,
    );

    if (!confirmed) {
      return;
    }

    this.removingItemId = item.cartItemId;
    this.errorMessage = '';

    this.cartService.removeItem(item.cartItemId).subscribe({
      next: (response) => {
        this.cart = response.data;
        this.removingItemId = null;
      },
      error: (error) => {
        this.removingItemId = null;
        this.errorMessage = error?.error?.message || 'Không thể xóa sản phẩm.';
      },
    });
  }

  clearCart(): void {
    if (!this.cart?.items?.length) {
      return;
    }

    if (!window.confirm('Bạn có chắc muốn xóa toàn bộ giỏ hàng?')) {
      return;
    }

    this.clearing = true;

    this.cartService.clearCart().subscribe({
      next: () => {
        this.clearing = false;
        this.cart = {
          items: [],
          subtotal: 0,
          totalQuantity: 0,
        };
        this.successMessage = 'Đã xóa toàn bộ giỏ hàng.';
      },
      error: (error) => {
        this.clearing = false;
        this.errorMessage = error?.error?.message || 'Không thể xóa giỏ hàng.';
      },
    });
  }

  goToCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = 'assets/images/product-placeholder.png';
  }
}
