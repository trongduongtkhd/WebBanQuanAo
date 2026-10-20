import { CurrentUser } from './user.model';

// captchaToken: token Cloudflare Turnstile, chỉ dùng được MỘT lần => submit thất bại phải reset widget lấy token mới.
export interface LoginRequest {
  email: string;
  password: string;
  captchaToken: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phoneNumber?: string | null;
  captchaToken: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: CurrentUser;
  requiresTwoFactor?: false;
}

// Bước 1 với tài khoản bật 2FA: CHƯA có access token. twoFactorToken chỉ giữ trong bộ nhớ, không lưu localStorage.
export interface TwoFactorChallenge {
  requiresTwoFactor: true;
  twoFactorToken: string;
  expiresAt: string;
  expiresInSeconds: number;
}

export type LoginResponse = AuthResponse | TwoFactorChallenge;

export function isTwoFactorChallenge(
  response: LoginResponse | null | undefined,
): response is TwoFactorChallenge {
  return !!response && response.requiresTwoFactor === true;
}

export interface TwoFactorVerifyRequest {
  twoFactorToken: string;
  code: string;
}

export interface TwoFactorRecoveryRequest {
  twoFactorToken: string;
  recoveryCode: string;
}

// Lý do 401 ở bước 2 (data.reason): ChallengeExpired / LockedOut => phải quay về bước nhập mật khẩu.
export type TwoFactorFailureReason =
  | 'InvalidCode'
  | 'Replayed'
  | 'ChallengeExpired'
  | 'LockedOut';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
