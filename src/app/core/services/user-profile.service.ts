import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  ChangePasswordRequest,
  UpdateProfileRequest,
  UserProfile,
} from '../models/profile.model';

@Injectable({
  providedIn: 'root',
})
export class UserProfileService {
  constructor(private http: HttpClient) {}

  getProfile() {
    return this.http.get<ApiResponse<UserProfile>>(
      `${environment.apiUrl}/users/profile`,
    );
  }

  updateProfile(request: UpdateProfileRequest) {
    return this.http.put<ApiResponse<UserProfile>>(
      `${environment.apiUrl}/users/profile`,
      request,
    );
  }

  changePassword(request: ChangePasswordRequest) {
    return this.http.put<ApiResponse<unknown>>(
      `${environment.apiUrl}/users/change-password`,
      request,
    );
  }
}
