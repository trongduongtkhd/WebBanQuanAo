import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ProductCardComponent } from './components/product-card/product-card.component';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { ImageUrlPipe } from './pipes/image-url.pipe';
import { MoneyInputDirective } from './directives/money-input.directive';

@NgModule({
  declarations: [
    ProductCardComponent,
    ImageUploadComponent,
    ImageUrlPipe,
    MoneyInputDirective,
  ],
  imports: [CommonModule, RouterModule],
  exports: [
    ProductCardComponent,
    RouterModule,
    ImageUploadComponent,
    ImageUrlPipe,
    MoneyInputDirective,
  ],
})
export class SharedModule {}
