import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ProductCardComponent } from './components/product-card/product-card.component';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';

@NgModule({
  declarations: [ProductCardComponent, ImageUploadComponent],
  imports: [CommonModule, RouterModule],
  exports: [ProductCardComponent, RouterModule, ImageUploadComponent],
})
export class SharedModule {}
