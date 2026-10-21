import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { ProductCardComponent } from './components/product-card/product-card.component';
import { QuickBuyModalComponent } from './components/quick-buy-modal/quick-buy-modal.component';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { TurnstileComponent } from './components/turnstile/turnstile.component';
import { ImageUrlPipe } from './pipes/image-url.pipe';
import { MoneyInputDirective } from './directives/money-input.directive';

@NgModule({
  declarations: [
    ProductCardComponent,
    QuickBuyModalComponent,
    ImageUploadComponent,
    TurnstileComponent,
    ImageUrlPipe,
    MoneyInputDirective,
  ],
  imports: [CommonModule, RouterModule],
  exports: [
    ProductCardComponent,
    QuickBuyModalComponent,
    RouterModule,
    ImageUploadComponent,
    TurnstileComponent,
    ImageUrlPipe,
    MoneyInputDirective,
  ],
})
export class SharedModule {}
