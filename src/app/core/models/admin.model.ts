export interface AdminCategory {
  categoryId: number;
  parentCategoryId?: number | null;
  parentCategoryName?: string | null;
  categoryName: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UpsertCategoryRequest {
  parentCategoryId?: number | null;
  categoryName: string;
  description?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}
export interface AdminBrand {
  brandId: number;
  brandName: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UpsertBrandRequest {
  brandName: string;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
}

export interface AdminColor {
  colorId: number;
  colorName: string;
  colorCode?: string | null;
}

export interface UpsertColorRequest {
  colorName: string;
  colorCode?: string | null;
}

export interface AdminSize {
  sizeId: number;
  sizeName: string;
  displayOrder: number;
}

export interface UpsertSizeRequest {
  sizeName: string;
  displayOrder: number;
}
export type Gender = 'Male' | 'Female' | 'Unisex';

export interface AdminProductList {
  productId: number;
  productName: string;
  slug: string;
  categoryName: string;
  brandName?: string | null;
  basePrice: number;
  salePrice?: number | null;
  thumbnailUrl?: string | null;
  totalStockQuantity: number;
  averageCostPrice?: number | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface AdminProductVariant {
  variantId: number;
  colorId: number;
  colorName: string;
  colorCode?: string | null;
  sizeId: number;
  sizeName: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  stockQuantity: number;
  averageCostPrice?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface AdminProductImage {
  imageId: number;
  imageUrl: string;
  displayOrder: number;
  isThumbnail: boolean;
}

export interface AdminProductDetail {
  productId: number;
  categoryId: number;
  categoryName: string;
  brandId?: number | null;
  brandName?: string | null;
  productName: string;
  slug: string;
  shortDescription?: string | null;
  description: string;
  material?: string | null;
  gender: Gender;
  basePrice: number;
  salePrice?: number | null;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  variants: AdminProductVariant[];
  images: AdminProductImage[];
}

export interface UpsertProductRequest {
  categoryId: number;
  brandId?: number | null;
  productName: string;
  shortDescription?: string | null;
  description: string;
  material?: string | null;
  gender: Gender;
  basePrice: number;
  salePrice?: number | null;
  isFeatured: boolean;
  isActive: boolean;
}

export interface UpsertProductVariantRequest {
  colorId: number;
  sizeId: number;
  sku: string;
  price: number;
  salePrice?: number | null;
  stockQuantity: number;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface AdminSupplier {
  supplierId: number;
  supplierName: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface UpsertSupplierRequest {
  supplierName: string;
  contactName?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  taxCode?: string | null;
  description?: string | null;
  isActive: boolean;
}

export interface PurchaseOrderListItem {
  purchaseOrderId: number;
  purchaseOrderCode: string;
  supplierId: number;
  supplierName: string;
  createdByUserName: string;
  totalItemCount: number;
  totalQuantity: number;
  totalAmount: number;
  status: PurchaseOrderStatus;
  createdAt: string;
}

export type PurchaseOrderStatus = 'Completed' | 'Cancelled';

export interface PurchaseOrderItem {
  purchaseOrderItemId: number;
  variantId: number;
  productName: string;
  sku: string;
  colorName: string;
  sizeName: string;
  unitCost: number;
  quantity: number;
  lineTotal: number;
}

export interface PurchaseOrderDetail {
  purchaseOrderId: number;
  purchaseOrderCode: string;
  supplierId: number;
  supplierName: string;
  supplierPhone?: string | null;
  createdByUserName: string;
  note?: string | null;
  totalAmount: number;
  status: PurchaseOrderStatus;
  createdAt: string;
  updatedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  items: PurchaseOrderItem[];
}

export interface CreatePurchaseOrderItemRequest {
  variantId: number;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderRequest {
  supplierId: number;
  note?: string | null;
  items: CreatePurchaseOrderItemRequest[];
}

export interface UpsertProductImageRequest {
  imageUrl: string;
  displayOrder: number;
  isThumbnail: boolean;
}
