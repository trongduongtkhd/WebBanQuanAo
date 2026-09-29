import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { WishlistItem } from '../models/wishlist.model';

@Injectable({
  providedIn: 'root',
})
export class WishlistService {
  private readonly apiUrl = `${environment.apiUrl}/wishlist`;

  private readonly wishlistProductIdsSubject = new BehaviorSubject<
    Set<number>
  >(new Set());

  readonly wishlistProductIds$ = this.wishlistProductIdsSubject.asObservable();

  readonly wishlistCount$ = this.wishlistProductIds$.pipe(
    map((ids) => ids.size),
  );

  constructor(private readonly http: HttpClient) {}

  getWishlist(): Observable<ApiResponse<WishlistItem[]>> {
    return this.http.get<ApiResponse<WishlistItem[]>>(this.apiUrl).pipe(
      tap((response) => {
        const ids = new Set((response.data || []).map((x) => x.productId));

        this.wishlistProductIdsSubject.next(ids);
      }),
    );
  }

  addItem(productId: number): Observable<ApiResponse<WishlistItem>> {
    return this.http
      .post<ApiResponse<WishlistItem>>(`${this.apiUrl}/items`, { productId })
      .pipe(
        tap(() => {
          const ids = new Set(this.wishlistProductIdsSubject.value);

          ids.add(productId);
          this.wishlistProductIdsSubject.next(ids);
        }),
      );
  }

  removeItem(productId: number): Observable<ApiResponse<null>> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/items/${productId}`)
      .pipe(
        tap(() => {
          const ids = new Set(this.wishlistProductIdsSubject.value);

          ids.delete(productId);
          this.wishlistProductIdsSubject.next(ids);
        }),
      );
  }

  refreshWishlist(): void {
    this.getWishlist().subscribe({
      error: () => this.wishlistProductIdsSubject.next(new Set()),
    });
  }

  resetWishlist(): void {
    this.wishlistProductIdsSubject.next(new Set());
  }
}
