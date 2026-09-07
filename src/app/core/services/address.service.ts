import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Address, UpsertAddressRequest } from '../models/address.model';

@Injectable({
  providedIn: 'root',
})
export class AddressService {
  constructor(private http: HttpClient) {}

  getMyAddresses() {
    return this.http.get<ApiResponse<Address[]>>(
      `${environment.apiUrl}/addresses`,
    );
  }

  create(request: UpsertAddressRequest) {
    return this.http.post<ApiResponse<Address>>(
      `${environment.apiUrl}/addresses`,
      request,
    );
  }

  update(addressId: number, request: UpsertAddressRequest) {
    return this.http.put<ApiResponse<Address>>(
      `${environment.apiUrl}/addresses/${addressId}`,
      request,
    );
  }

  setDefault(addressId: number) {
    return this.http.put<ApiResponse<unknown>>(
      `${environment.apiUrl}/addresses/${addressId}/set-default`,
      {},
    );
  }

  delete(addressId: number) {
    return this.http.delete<ApiResponse<unknown>>(
      `${environment.apiUrl}/addresses/${addressId}`,
    );
  }
}
