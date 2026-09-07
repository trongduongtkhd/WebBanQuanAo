import { Component, Input } from '@angular/core';
import { PublicProduct } from '../../../core/models/catalog.model';

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
})
export class ProductCardComponent {
  @Input() product!: PublicProduct;
  onImageError(event: Event): void {
    const image = event.target as HTMLImageElement;

    image.src = 'assets/images/placeholders/ao-sweater.jpg';
  }
}
