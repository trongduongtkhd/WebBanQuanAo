export interface PublicCategory {
  categoryId: number;
  categoryName: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  children: PublicCategory[];
}

export interface PublicBrand {
  brandId: number;
  brandName: string;
  logoUrl?: string | null;
}

export interface PublicProduct {
  productId: number;
  productName: string;
  slug: string;
  categoryName: string;
  brandName?: string | null;
  basePrice: number;
  salePrice?: number | null;
  thumbnailUrl?: string | null;
  isFeatured: boolean;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ProductQuery {
  keyword?: string;
  categoryId?: number;
  brandId?: number;
  gender?: 'Male' | 'Female' | 'Unisex';
  minPrice?: number;
  maxPrice?: number;
  sort?: 'newest' | 'priceAsc' | 'priceDesc' | 'bestSelling';
  page?: number;
  pageSize?: number;
}
