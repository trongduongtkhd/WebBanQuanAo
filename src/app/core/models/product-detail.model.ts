export interface ProductImage {
  imageId: number;
  imageUrl: string;
  displayOrder: number;
  isThumbnail: boolean;
}

export interface ProductVariantDetail {
  variantId: number;

  colorId: number;
  colorName: string;
  colorCode?: string;

  sizeId: number;
  sizeName: string;

  sku: string;
  price: number;
  salePrice?: number | null;
  stockQuantity: number;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface ProductDetail {
  productId: number;
  productName: string;
  slug: string;
  description?: string | null;

  categoryName: string;
  brandName?: string | null;

  basePrice: number;
  salePrice?: number | null;

  isFeatured: boolean;
  isActive: boolean;

  images: ProductImage[];
  variants: ProductVariantDetail[];
}

export interface AddCartItemRequest {
  VariantId: number;
  quantity: number;
}
