import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ImageUploadService } from '../../../core/services/image-upload.service';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
})
export class ImageUploadComponent {
  @Input() folder = 'products';
  @Input() currentImageUrl = '';

  @Output() imageUploaded = new EventEmitter<string>();

  uploading = false;
  errorMessage = '';

  constructor(private imageUploadService: ImageUploadService) {}

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    this.errorMessage = '';

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Vui lòng chọn một file ảnh.';
      input.value = '';
      return;
    }

    this.uploading = true;

    this.imageUploadService.uploadImage(file, this.folder).subscribe({
      next: (response) => {
        this.uploading = false;
        this.currentImageUrl = response.data.imageUrl;
        this.imageUploaded.emit(response.data.imageUrl);
        input.value = '';
      },
      error: (error) => {
        this.uploading = false;
        this.errorMessage = error?.error?.message || 'Không thể upload ảnh.';
        input.value = '';
      },
    });
  }

  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;
    image.style.display = 'none';
  }
}
