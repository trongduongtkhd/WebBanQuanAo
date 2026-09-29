import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';

@Pipe({ name: 'imageUrl' })
export class ImageUrlPipe implements PipeTransform {
  transform(url: string | null | undefined): string | null | undefined {
    // Chỉ ghép domain backend cho các đường dẫn tuyệt đối kiểu "/uploads/..."
    // do API trả về. Bỏ qua URL đầy đủ (http/https) và asset cục bộ (assets/...).
    if (!url || !url.startsWith('/') || url.startsWith('//')) {
      return url;
    }

    return `${environment.apiOrigin}${url}`;
  }
}
