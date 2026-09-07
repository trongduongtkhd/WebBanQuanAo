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

export interface UpsertAddressRequest {
  receiverName: string;
  receiverPhone: string;

  addressDetail: string;
  ward?: string | null;
  district?: string | null;
  province: string;

  isDefault: boolean;
}
