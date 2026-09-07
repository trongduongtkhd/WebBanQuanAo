import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../models/auth.model';
import { CurrentUser } from '../models/user.model';
import { TokenService } from './token.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(
    this.tokenService.getUser(),
  );

  readonly currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly tokenService: TokenService,
  ) {}

  get currentUser(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  login(payload: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, payload)
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  register(payload: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, payload)
      .pipe(tap((response) => this.handleAuthResponse(response)));
  }

  getMe(): Observable<ApiResponse<CurrentUser>> {
    return this.http.get<ApiResponse<CurrentUser>>(`${this.apiUrl}/me`).pipe(
      tap((response) => {
        if (response.success) {
          const token = this.tokenService.getToken();

          if (token) {
            this.tokenService.setSession(token, response.data);
            this.currentUserSubject.next(response.data);
          }
        }
      }),
    );
  }

  logout(): void {
    this.tokenService.clearSession();
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    return !!this.tokenService.getToken();
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  private handleAuthResponse(response: ApiResponse<AuthResponse>): void {
    if (!response.success) {
      return;
    }

    this.tokenService.setSession(response.data.accessToken, response.data.user);

    this.currentUserSubject.next(response.data.user);
  }

  updateCurrentUser(user: CurrentUser): void {
    this.currentUserSubject.next(user);
  }
}
