import { Injectable } from '@angular/core';
import { CurrentUser } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  // Access token CHỈ nằm trong bộ nhớ (mất khi F5, được khôi phục bằng /auth/refresh lúc khởi động app).
  // Không lưu localStorage để mã XSS không đọc được token lâu dài.
  // Refresh token nằm trong cookie HttpOnly do server quản lý, JavaScript không truy cập được.
  private accessToken: string | null = null;

  // Thông tin hiển thị (không nhạy cảm); đồng thời là "gợi ý" rằng trình duyệt đang có phiên đăng nhập.
  private readonly userKey = 'clothing_current_user';

  // Key lưu access token của phiên bản cũ - xoá đi nếu còn sót.
  private readonly legacyTokenKey = 'clothing_access_token';

  constructor() {
    localStorage.removeItem(this.legacyTokenKey);
  }

  setSession(token: string, user: CurrentUser): void {
    this.accessToken = token;
    this.setUser(user);
  }

  setUser(user: CurrentUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getToken(): string | null {
    return this.accessToken;
  }

  getUser(): CurrentUser | null {
    const userJson = localStorage.getItem(this.userKey);

    if (!userJson) {
      return null;
    }

    try {
      return JSON.parse(userJson) as CurrentUser;
    } catch {
      this.clearSession();
      return null;
    }
  }

  clearSession(): void {
    this.accessToken = null;
    localStorage.removeItem(this.userKey);
  }
}
