import { environment } from '../../../environments/environment';
import { ImageUrlPipe } from './image-url.pipe';

describe('Responsive image URLs', () => {
  const pipe = new ImageUrlPipe();
  it('uses a bounded upload image variant', () => {
    expect(pipe.transform('/uploads/products/test.jpg', 640)).toBe(`${environment.apiOrigin}/uploads/products/test.jpg?w=640`);
    expect(pipe.transform('/uploads/products/test.jpg?w=320', 640)).toBe(`${environment.apiOrigin}/uploads/products/test.jpg?w=640`);
  });
  it('uses generated content-hashed files for static images', () => {
    expect(pipe.transform('assets/images/banners/hero-banner.jpg', 640)).toMatch(/^assets\/images\/optimized\/640\/[a-f0-9]{16}\.webp$/);
  });
  it('preserves external images, original URLs and empty values', () => {
    expect(pipe.transform('https://example.com/a.jpg', 640)).toBe('https://example.com/a.jpg');
    expect(pipe.transform('/uploads/products/a.jpg')).toBe(`${environment.apiOrigin}/uploads/products/a.jpg`);
    expect(pipe.transform('/uploads/products/a.jpg', 999999)).toBe(`${environment.apiOrigin}/uploads/products/a.jpg`);
    expect(pipe.transform(null, 640)).toBeNull();
  });
});
