import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Cart, UpdateCartItemRequest } from '../models/cart.model';

@Injectable({
  providedIn: 'root',
})
export class CartService {
  private cartCountSubject = new BehaviorSubject<number>(0);

  cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient) {}

  getCart() {
    return this.http.get<ApiResponse<Cart>>(`${environment.apiUrl}/cart`).pipe(
      tap((response) => {
        this.cartCountSubject.next(response.data?.totalQuantity || 0);
      }),
    );
  }

  addItem(request: { variantId: number; quantity: number }) {
    return this.http
      .post<ApiResponse<Cart>>(`${environment.apiUrl}/cart/items`, request)
      .pipe(
        tap((response) => {
          this.cartCountSubject.next(response.data?.totalQuantity || 0);
        }),
      );
  }

  updateItem(cartItemId: number, request: UpdateCartItemRequest) {
    return this.http
      .put<
        ApiResponse<Cart>
      >(`${environment.apiUrl}/cart/items/${cartItemId}`, request)
      .pipe(
        tap((response) => {
          this.cartCountSubject.next(response.data?.totalQuantity || 0);
        }),
      );
  }

  removeItem(cartItemId: number) {
    return this.http
      .delete<
        ApiResponse<Cart>
      >(`${environment.apiUrl}/cart/items/${cartItemId}`)
      .pipe(
        tap((response) => {
          this.cartCountSubject.next(response.data?.totalQuantity || 0);
        }),
      );
  }

  clearCart() {
    return this.http
      .delete<ApiResponse<unknown>>(`${environment.apiUrl}/cart`)
      .pipe(tap(() => this.cartCountSubject.next(0)));
  }

  refreshCartCount(): void {
    this.getCart().subscribe({
      error: () => this.cartCountSubject.next(0),
    });
  }

  resetCartCount(): void {
    this.cartCountSubject.next(0);
  }
}
