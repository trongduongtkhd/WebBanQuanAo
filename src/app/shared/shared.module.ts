import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ProductCardComponent } from './components/product-card/product-card.component';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { ImageUrlPipe } from './pipes/image-url.pipe';

@NgModule({
  declarations: [ProductCardComponent, ImageUploadComponent, ImageUrlPipe],
  imports: [CommonModule, RouterModule],
  exports: [ProductCardComponent, RouterModule, ImageUploadComponent, ImageUrlPipe],
})
export class SharedModule {}
