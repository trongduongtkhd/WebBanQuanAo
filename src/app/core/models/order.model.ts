export interface OrderSummary {
  orderId: number;
  orderCode: string;
  totalAmount: number;

  orderStatus: number | string;
  paymentStatus: number | string;

  createdAt: string;
  totalItems: number;
}

export interface OrderItem {
  orderItemId: number;
  variantId: number;

  productName: string;
  sku: string;
  colorName: string;
  sizeName: string;

  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface OrderStatusHistory {
  orderStatusHistoryId: number;
  status: number | string;
  note?: string | null;
  changedByName?: string | null;
  createdAt: string;
}

export interface Payment {
  paymentId: number;

  paymentMethod: number | string;
  amount: number;
  paymentStatus: number | string;

  transactionCode?: string | null;
  paidAt?: string | null;
  createdAt: string;
}

export interface OrderDetail {
  orderId: number;
  orderCode: string;

  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  note?: string | null;

  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  totalAmount: number;
  couponCode?: string | null;

  orderStatus: number | string;
  paymentStatus: number | string;
  createdAt: string;

  items: OrderItem[];
  payments: Payment[];
  statusHistories: OrderStatusHistory[];
}

export interface MockQr {
  orderCode: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  transferContent: string;
  message: string;
}

export interface CancelOrderRequest {
  reason?: string | null;
}

export interface AdminOrderSummary {
  orderId: number;
  orderCode: string;

  customerName: string;
  customerEmail: string;
  receiverName: string;

  totalAmount: number;

  orderStatus: number | string;
  paymentStatus: number | string;

  createdAt: string;
}

export interface UpdateOrderStatusRequest {
  status: number;
  note?: string | null;
}

export interface UpdatePaymentStatusRequest {
  paymentStatus: number;
  note?: string | null;
}
