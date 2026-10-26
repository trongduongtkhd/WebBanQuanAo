import { Pipe, PipeTransform } from '@angular/core';
import { environment } from '../../../environments/environment';
import { OPTIMIZED_IMAGE_HASHES } from '../../core/utils/optimized-images';

@Pipe({ name: 'imageUrl' })
export class ImageUrlPipe implements PipeTransform {
  transform(url: string | null | undefined, width?: number): string | null | undefined {
    const validWidth = width !== undefined && [160, 320, 640, 960, 1280, 1920].includes(width);
    if (url && validWidth) {
      const hash = OPTIMIZED_IMAGE_HASHES[url];
      if (hash) { return `assets/images/optimized/${width}/${hash}.webp`; }
      if (url.startsWith('/uploads/')) {
        const [pathname, query = ''] = url.split('?');
        const params = new URLSearchParams(query);
        params.set('w', String(width));
        return `${environment.apiOrigin}${pathname}?${params.toString()}`;
      }
    }
    // Chỉ ghép domain backend cho các đường dẫn tuyệt đối kiểu "/uploads/..."
    // do API trả về. Bỏ qua URL đầy đủ (http/https) và asset cục bộ (assets/...).
    if (!url || !url.startsWith('/') || url.startsWith('//')) {
      return url;
    }

    return `${environment.apiOrigin}${url}`;
  }
}
