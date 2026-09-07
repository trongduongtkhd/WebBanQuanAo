import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartRoutingModule } from './cart-routing.module';
import { CartComponent } from './pages/cart/cart.component';

@NgModule({
  declarations: [CartComponent],
  imports: [CommonModule, FormsModule, CartRoutingModule],
})
export class CartModule {}
