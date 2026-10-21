import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { PublicProduct } from '../../../core/models/catalog.model';
import {
  ProductDetail,
  ProductVariantDetail,
} from '../../../core/models/product-detail.model';
import { CartService } from '../../../core/services/cart.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { QuickBuyService } from '../../../core/services/quick-buy.service';
import { TokenService } from '../../../core/services/token.service';
import {
  getApiErrorMessage,
  MAX_CART_QUANTITY,
} from '../../../core/utils/api-error.util';

@Component({
  selector: 'app-quick-buy-modal',
  templateUrl: './quick-buy-modal.component.html',
  styleUrls: ['./quick-buy-modal.component.scss'],
})
export class QuickBuyModalComponent implements OnInit, OnDestroy {
  card: PublicProduct | null = null;
  product: ProductDetail | null = null;

  loading = false;
  addingToCart = false;
  errorMessage = '';
  successMessage = '';

  selectedColorId: number | null = null;
  selectedSizeId: number | null = null;
  quantity = 1;

  private subscription?: Subscription;

  constructor(
    private readonly quickBuyService: QuickBuyService,
    private readonly catalogService: CatalogService,
    private readonly cartService: CartService,
    private readonly tokenService: TokenService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.subscription = this.quickBuyService.product$.subscribe((card) => {
      this.card = card;
      this.reset();

      if (card) {
        this.loadProduct(card.slug);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.card) {
      this.close();
    }
  }

  close(): void {
    this.quickBuyService.close();
  }

  private reset(): void {
    this.product = null;
    this.loading = false;
    this.addingToCart = false;
    this.errorMessage = '';
    this.successMessage = '';
    this.selectedColorId = null;
    this.selectedSizeId = null;
    this.quantity = 1;
  }

  private loadProduct(slug: string): void {
    this.loading = true;

    this.catalogService.getProductDetail(slug).subscribe({
      next: (response) => {
        // Bỏ qua kết quả cũ nếu người dùng đã đóng/mở thẻ khác.
        if (this.card?.slug !== slug) {
          return;
        }

        this.product = response.data;
        this.loading = false;

        // Chỉ có một màu thì chọn sẵn cho nhanh.
        if (this.colors.length === 1) {
          this.selectColor(this.colors[0].colorId);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = getApiErrorMessage(
          error,
          'Không thể tải thông tin sản phẩm.',
        );
      },
    });
  }

  get activeVariants(): ProductVariantDetail[] {
    return (this.product?.variants || []).filter((x) => x.isActive);
  }

  get colors(): ProductVariantDetail[] {
    return this.activeVariants.filter(
      (variant, index, all) =>
        all.findIndex((x) => x.colorId === variant.colorId) === index,
    );
  }

  get availableSizes(): ProductVariantDetail[] {
    if (!this.selectedColorId) {
      return [];
    }

    return this.activeVariants.filter((x) => x.colorId === this.selectedColorId);
  }

  get selectedVariant(): ProductVariantDetail | null {
    if (!this.selectedColorId || !this.selectedSizeId) {
      return null;
    }

    return (
      this.activeVariants.find(
        (x) =>
          x.colorId === this.selectedColorId &&
          x.sizeId === this.selectedSizeId,
      ) || null
    );
  }

  get stockQuantity(): number {
    return this.selectedVariant?.stockQuantity || 0;
  }

  get currentPrice(): number {
    if (this.selectedVariant) {
      return (
        this.selectedVariant.effectiveSalePrice ||
        this.selectedVariant.effectivePrice
      );
    }

    return this.card?.salePrice || this.card?.basePrice || 0;
  }

  get imageUrl(): string | null {
    const colorImage = this.activeVariants.find(
      (x) => x.colorId === this.selectedColorId && x.imageUrl,
    )?.imageUrl;

    return colorImage || this.card?.thumbnailUrl || null;
  }

  selectColor(colorId: number): void {
    this.selectedColorId = colorId;
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.availableSizes.some((x) => x.sizeId === this.selectedSizeId)) {
      this.selectedSizeId = null;
    }

    this.quantity = 1;
  }

  selectSize(sizeId: number): void {
    this.selectedSizeId = sizeId;
    this.errorMessage = '';
    this.successMessage = '';
    this.quantity = 1;
  }

  decreaseQuantity(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  increaseQuantity(): void {
    if (!this.selectedVariant) {
      return;
    }

    this.quantity = Math.min(
      this.stockQuantity,
      MAX_CART_QUANTITY,
      this.quantity + 1,
    );
  }

  // Trả về biến thể hợp lệ để mua, hoặc null (đã set errorMessage).
  private validateSelection(): ProductVariantDetail | null {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.selectedColorId) {
      this.errorMessage = 'Vui lòng chọn màu sản phẩm.';
      return null;
    }

    if (!this.selectedSizeId) {
      this.errorMessage = 'Vui lòng chọn kích thước.';
      return null;
    }

    const variant = this.selectedVariant;

    if (!variant) {
      this.errorMessage = 'Tổ hợp màu và kích thước này không tồn tại.';
      return null;
    }

    if (variant.stockQuantity <= 0) {
      this.errorMessage = 'Sản phẩm này hiện đã hết hàng.';
      return null;
    }

    return variant;
  }

  private redirectToLogin(returnUrl: string): void {
    this.close();
    this.router.navigate(['/auth/login'], { queryParams: { returnUrl } });
  }

  addToCart(): void {
    const variant = this.validateSelection();

    if (!variant || this.addingToCart) {
      return;
    }

    if (!this.tokenService.getToken()) {
      this.redirectToLogin(this.router.url);
      return;
    }

    this.addingToCart = true;

    this.cartService
      .addItem({ variantId: variant.variantId, quantity: this.quantity })
      .subscribe({
        next: (response) => {
          this.addingToCart = false;
          this.successMessage =
            response.message || 'Đã thêm sản phẩm vào giỏ hàng.';
        },
        error: (error) => {
          this.addingToCart = false;
          this.errorMessage = getApiErrorMessage(
            error,
            'Không thể thêm sản phẩm vào giỏ hàng.',
          );
        },
      });
  }

  buyNow(): void {
    const variant = this.validateSelection();

    if (!variant) {
      return;
    }

    // slug để trang checkout dựng lại thông tin sản phẩm (không có API lấy variant theo id).
    const queryParams = {
      buyNow: variant.variantId,
      qty: this.quantity,
      slug: this.card?.slug,
    };

    if (!this.tokenService.getToken()) {
      this.redirectToLogin(
        this.router.createUrlTree(['/checkout'], { queryParams }).toString(),
      );
      return;
    }

    this.close();
    this.router.navigate(['/checkout'], { queryParams });
  }
}
