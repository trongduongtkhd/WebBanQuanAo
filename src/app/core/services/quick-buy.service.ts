import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { PublicProduct } from '../models/catalog.model';

// Điều khiển popup chọn nhanh màu/size/số lượng từ thẻ sản phẩm.
// Popup được render một lần ở layout (tránh bị transform của thẻ làm lệch vị trí).
@Injectable({
  providedIn: 'root',
})
export class QuickBuyService {
  private readonly productSubject = new BehaviorSubject<PublicProduct | null>(
    null,
  );

  product$ = this.productSubject.asObservable();

  open(product: PublicProduct): void {
    this.productSubject.next(product);
  }

  close(): void {
    this.productSubject.next(null);
  }
}
