// Chỉ nhận được khi 2FA CHƯA bật. Không lưu lại ở đâu sau khi thiết lập xong.
export interface TwoFactorSetup {
  secret: string;
  otpauthUri: string;
  qrCodeDataUri: string;
}

export interface EnableTwoFactorResponse {
  recoveryCodes: string[];
}

// Nhập một trong hai: code (mã 6 số) hoặc recoveryCode.
export interface DisableTwoFactorRequest {
  password: string;
  code?: string | null;
  recoveryCode?: string | null;
}
