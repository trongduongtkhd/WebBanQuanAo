import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductDetail } from '../models/product-detail.model';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  PagedResult,
  ProductQuery,
  PublicBrand,
  PublicCategory,
  PublicProduct,
} from '../models/catalog.model';

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  getCategories(): Observable<ApiResponse<PublicCategory[]>> {
    return this.http.get<ApiResponse<PublicCategory[]>>(
      `${this.apiUrl}/categories`,
    );
  }

  getBrands(): Observable<ApiResponse<PublicBrand[]>> {
    return this.http.get<ApiResponse<PublicBrand[]>>(`${this.apiUrl}/brands`);
  }

  getFeaturedProducts(limit = 8): Observable<ApiResponse<PublicProduct[]>> {
    return this.http.get<ApiResponse<PublicProduct[]>>(
      `${this.apiUrl}/products/featured`,
      {
        params: new HttpParams().set('limit', limit.toString()),
      },
    );
  }

  getNewArrivalProducts(limit = 8): Observable<ApiResponse<PublicProduct[]>> {
    return this.http.get<ApiResponse<PublicProduct[]>>(
      `${this.apiUrl}/products/new-arrivals`,
      {
        params: new HttpParams().set('limit', limit.toString()),
      },
    );
  }

  getProducts(
    query: ProductQuery,
  ): Observable<ApiResponse<PagedResult<PublicProduct>>> {
    let params = new HttpParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<ApiResponse<PagedResult<PublicProduct>>>(
      `${this.apiUrl}/products`,
      { params },
    );
  }
  getProductDetail(slug: string) {
    return this.http.get<ApiResponse<ProductDetail>>(
      `${environment.apiUrl}/products/slug/${slug}`,
    );
  }
}
