export interface CartItem {
  cartItemId: number;

  variantId: number;
  productId: number;

  productName: string;
  thumbnailUrl?: string | null;

  colorName: string;
  sizeName: string;

  unitPrice: number;
  stockQuantity: number;
  quantity: number;

  totalPrice: number;
  isAvailable: boolean;
  isForSale: boolean;
}

export interface Cart {
  items: CartItem[];
  totalQuantity: number;
  subtotal: number;
  shippingFee: number;
  freeShippingThreshold: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
