export interface Address {
  addressId: number;
  receiverName: string;
  receiverPhone: string;
  addressDetail: string;
  ward?: string | null;
  district?: string | null;
  province: string;
  isDefault: boolean;
  createdAt: string;
}

export interface CouponValidation {
  couponId: number;
  couponCode: string;
  couponName: string;

  subtotal: number;
  eligibleSubtotal: number;
  discountAmount: number;
  amountAfterDiscount: number;
}

export interface CreateOrderRequest {
  addressId: number;

  // PaymentMethod enum backend:
  // COD = 1, MockQR = 2
  paymentMethod: number;

  couponCode?: string | null;
  note?: string | null;
}

export interface Payment {
  paymentId: number;
  paymentMethod: number;
  amount: number;
  paymentStatus: number;
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

  orderStatus: number;
  paymentStatus: number;
  createdAt: string;

  items: unknown[];
  payments: Payment[];
  statusHistories: unknown[];
}

export interface MockQr {
  orderCode: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  transferContent: string;
  message: string;
}
