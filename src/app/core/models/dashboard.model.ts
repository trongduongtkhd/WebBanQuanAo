export interface Dashboard {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
  lowStockProducts: number;

  recentOrders: RecentOrder[];
  bestSellingProducts: BestSellingProduct[];
  lowStockVariants: LowStockVariant[];
}

export interface RecentOrder {
  orderId: number;
  orderCode: string;
  customerName: string;
  totalAmount: number;
  orderStatus: number | string;
  createdAt: string;
}

export interface BestSellingProduct {
  productId: number;
  productName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface LowStockVariant {
  variantId: number;
  productId: number;

  productName: string;
  sku: string;

  colorName: string;
  sizeName: string;

  stockQuantity: number;
}
