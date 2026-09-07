import { Injectable } from '@angular/core';
import { CurrentUser } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private readonly tokenKey = 'clothing_access_token';
  private readonly userKey = 'clothing_current_user';

  setSession(token: string, user: CurrentUser): void {
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
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
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}
