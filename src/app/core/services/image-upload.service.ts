import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface UploadImageResponse {
  imageUrl: string;
  fileName: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImageUploadService {
  constructor(private http: HttpClient) {}

  uploadImage(file: File, folder: string) {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ApiResponse<UploadImageResponse>>(
      `${environment.apiUrl}/uploads/images/${folder}`,
      formData,
    );
  }
}
