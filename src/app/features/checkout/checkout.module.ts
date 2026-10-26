import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { CheckoutRoutingModule } from './checkout-routing.module';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { VnpayResultComponent } from './pages/vnpay-result/vnpay-result.component';

@NgModule({
  declarations: [CheckoutComponent, VnpayResultComponent],
  imports: [CommonModule, FormsModule, CheckoutRoutingModule],
})
export class CheckoutModule {}
