import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ProductDetail,
  ProductImage,
  ProductVariantDetail,
} from '../../../../core/models/product-detail.model';
import { CatalogService } from '../../../../core/services/catalog.service';
import { CartService } from '../../../../core/services/cart.service';
import { TokenService } from '../../../../core/services/token.service';

import { PublicReview } from '../../../../core/models/review.model';
import { ReviewService } from '../../../../core/services/review.service';
@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
})
export class ProductDetailComponent implements OnInit {
  product: ProductDetail | null = null;

  loading = true;
  errorMessage = '';
  successMessage = '';
  cartErrorMessage = '';

  selectedImage = 'assets/images/product-placeholder.png';
  selectedColorId: number | null = null;
  selectedSizeId: number | null = null;
  quantity = 1;

  addingToCart = false;

  reviews: PublicReview[] = [];

  reviewsLoading = false;
  reviewPage = 1;
  reviewTotalPages = 1;
  reviewTotalItems = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private catalogService: CatalogService,
    private cartService: CartService,
    private tokenService: TokenService,
    private reviewService: ReviewService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');

      if (!slug) {
        this.loading = false;
        this.errorMessage = 'Không tìm thấy sản phẩm.';
        return;
      }

      this.loadProduct(slug);
    });
  }

  loadProduct(slug: string): void {
    this.loading = true;
    this.errorMessage = '';

    this.catalogService.getProductDetail(slug).subscribe({
      next: (response) => {
        this.product = response.data;
        this.reviewPage = 1;
        this.loadReviews(this.product.productId);
        this.loading = false;

        const thumbnail = this.product.images?.find((x) => x.isThumbnail);
        const firstImage = this.product.images?.[0];

        this.selectedImage =
          thumbnail?.imageUrl ||
          firstImage?.imageUrl ||
          'assets/images/product-placeholder.png';
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Không thể tải thông tin sản phẩm.';
      },
    });
  }

  get activeVariants(): ProductVariantDetail[] {
    return (this.product?.variants || []).filter((x) => x.isActive);
  }

  get colors(): ProductVariantDetail[] {
    const uniqueColors: ProductVariantDetail[] = [];

    this.activeVariants.forEach((variant) => {
      const existed = uniqueColors.some((x) => x.colorId === variant.colorId);

      if (!existed) {
        uniqueColors.push(variant);
      }
    });

    return uniqueColors;
  }

  get availableSizes(): ProductVariantDetail[] {
    if (!this.selectedColorId) {
      return [];
    }

    const variantsByColor = this.activeVariants.filter(
      (x) => x.colorId === this.selectedColorId,
    );

    const uniqueSizes: ProductVariantDetail[] = [];

    variantsByColor.forEach((variant) => {
      const existed = uniqueSizes.some((x) => x.sizeId === variant.sizeId);

      if (!existed) {
        uniqueSizes.push(variant);
      }
    });

    return uniqueSizes;
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

  get currentPrice(): number {
    if (this.selectedVariant) {
      return this.selectedVariant.salePrice || this.selectedVariant.price;
    }

    if (!this.product) {
      return 0;
    }

    return this.product.salePrice || this.product.basePrice;
  }

  get stockQuantity(): number {
    return this.selectedVariant?.stockQuantity || 0;
  }

  get canAddToCart(): boolean {
    return (
      !!this.selectedVariant && this.stockQuantity > 0 && !this.addingToCart
    );
  }

  selectColor(colorId: number): void {
    this.selectedColorId = colorId;
    this.successMessage = '';
    this.cartErrorMessage = '';

    const isCurrentSizeAvailable = this.availableSizes.some(
      (x) => x.sizeId === this.selectedSizeId,
    );

    if (!isCurrentSizeAvailable) {
      this.selectedSizeId = null;
    }

    const variantWithColor = this.activeVariants.find(
      (x) => x.colorId === colorId && x.imageUrl,
    );

    if (variantWithColor?.imageUrl) {
      this.selectedImage = variantWithColor.imageUrl;
    }
  }

  selectSize(sizeId: number): void {
    this.selectedSizeId = sizeId;
    this.successMessage = '';
    this.cartErrorMessage = '';

    if (this.quantity > this.stockQuantity) {
      this.quantity = this.stockQuantity || 1;
    }
    if (this.stockQuantity > 0) {
      this.quantity = Math.min(this.quantity, this.stockQuantity);
    } else {
      this.quantity = 1;
    }
  }

  selectImage(image: ProductImage): void {
    this.selectedImage = image.imageUrl;
  }

  decreaseQuantity(): void {
    this.quantity = Math.max(1, this.quantity - 1);
  }

  increaseQuantity(): void {
    if (!this.selectedVariant) {
      return;
    }

    this.quantity = Math.min(this.stockQuantity, this.quantity + 1);
  }

  addToCart(): void {
    this.successMessage = '';
    this.cartErrorMessage = '';

    if (!this.tokenService.getToken()) {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: this.router.url,
        },
      });

      return;
    }

    if (!this.selectedColorId) {
      this.cartErrorMessage = 'Vui lòng chọn màu sản phẩm.';
      return;
    }

    if (!this.selectedSizeId) {
      this.cartErrorMessage = 'Vui lòng chọn kích thước.';
      return;
    }

    if (!this.selectedVariant) {
      this.cartErrorMessage = 'Tổ hợp màu và kích thước này không tồn tại.';
      return;
    }

    if (this.stockQuantity <= 0) {
      this.cartErrorMessage = 'Sản phẩm này hiện đã hết hàng.';
      return;
    }

    this.addingToCart = true;

    this.cartService
      .addItem({
        variantId: this.selectedVariant.variantId,
        quantity: this.quantity,
      })
      .subscribe({
        next: (response) => {
          this.addingToCart = false;
          this.successMessage =
            response.message || 'Đã thêm sản phẩm vào giỏ hàng.';
        },
        error: (error) => {
          this.addingToCart = false;

          console.error('Không thể thêm giỏ hàng:', {
            status: error.status,
            response: error.error,
            request: {
              VariantId: this.selectedVariant?.variantId,
              quantity: this.quantity,
            },
          });

          this.cartErrorMessage =
            error?.error?.message ||
            error?.error?.title ||
            'Không thể thêm sản phẩm vào giỏ hàng.';
        },
      });
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.src = 'assets/images/product-placeholder.png';
  }

  // review
  loadReviews(productId: number): void {
    this.reviewsLoading = true;

    this.reviewService
      .getPublicByProduct(productId, this.reviewPage)
      .subscribe({
        next: (response) => {
          this.reviews = response.data.items || [];
          this.reviewTotalItems = response.data.totalItems || 0;
          this.reviewTotalPages = response.data.totalPages || 1;
          this.reviewsLoading = false;
        },
        error: () => {
          this.reviews = [];
          this.reviewsLoading = false;
        },
      });
  }

  previousReviewPage(): void {
    if (!this.product || this.reviewPage <= 1) {
      return;
    }

    this.reviewPage--;
    this.loadReviews(this.product.productId);
  }

  nextReviewPage(): void {
    if (!this.product || this.reviewPage >= this.reviewTotalPages) {
      return;
    }

    this.reviewPage++;
    this.loadReviews(this.product.productId);
  }

  getStars(rating: number): number[] {
    return Array(rating).fill(0);
  }
}
