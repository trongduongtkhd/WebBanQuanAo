import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { PagedResult } from '../../../core/models/catalog.model';
import {
  AdminProductDetail,
  AdminProductImage,
  AdminProductList,
  AdminProductVariant,
  UpsertProductImageRequest,
  UpsertProductRequest,
  UpsertProductVariantRequest,
} from '../../../core/models/admin.model';

@Injectable({
  providedIn: 'root',
})
export class AdminProductService {
  private readonly apiUrl = `${environment.apiUrl}/admin/products`;

  constructor(private readonly http: HttpClient) {}

  getAll(
    keyword = '',
    isActive?: boolean,
    page = 1,
    pageSize = 10,
  ): Observable<ApiResponse<PagedResult<AdminProductList>>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (keyword.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    if (isActive !== undefined) {
      params = params.set('isActive', isActive.toString());
    }

    return this.http.get<ApiResponse<PagedResult<AdminProductList>>>(
      this.apiUrl,
      { params },
    );
  }

  getById(productId: number): Observable<ApiResponse<AdminProductDetail>> {
    return this.http.get<ApiResponse<AdminProductDetail>>(
      `${this.apiUrl}/${productId}`,
    );
  }

  create(
    payload: UpsertProductRequest,
  ): Observable<ApiResponse<AdminProductDetail>> {
    return this.http.post<ApiResponse<AdminProductDetail>>(
      this.apiUrl,
      payload,
    );
  }

  update(
    productId: number,
    payload: UpsertProductRequest,
  ): Observable<ApiResponse<AdminProductDetail>> {
    return this.http.put<ApiResponse<AdminProductDetail>>(
      `${this.apiUrl}/${productId}`,
      payload,
    );
  }

  delete(productId: number): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(`${this.apiUrl}/${productId}`);
  }

  createVariant(
    productId: number,
    payload: UpsertProductVariantRequest,
  ): Observable<ApiResponse<AdminProductVariant>> {
    return this.http.post<ApiResponse<AdminProductVariant>>(
      `${this.apiUrl}/${productId}/variants`,
      payload,
    );
  }

  updateVariant(
    productId: number,
    variantId: number,
    payload: UpsertProductVariantRequest,
  ): Observable<ApiResponse<AdminProductVariant>> {
    return this.http.put<ApiResponse<AdminProductVariant>>(
      `${this.apiUrl}/${productId}/variants/${variantId}`,
      payload,
    );
  }

  deleteVariant(
    productId: number,
    variantId: number,
  ): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(
      `${this.apiUrl}/${productId}/variants/${variantId}`,
    );
  }

  createImage(
    productId: number,
    payload: UpsertProductImageRequest,
  ): Observable<ApiResponse<AdminProductImage>> {
    return this.http.post<ApiResponse<AdminProductImage>>(
      `${this.apiUrl}/${productId}/images`,
      payload,
    );
  }

  deleteImage(
    productId: number,
    imageId: number,
  ): Observable<ApiResponse<object>> {
    return this.http.delete<ApiResponse<object>>(
      `${this.apiUrl}/${productId}/images/${imageId}`,
    );
  }
}
