import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AccountRoutingModule } from './account-routing.module';
import { AddressesComponent } from './pages/addresses/addresses.component';
import { OrderListComponent } from './pages/order-list/order-list.component';
import { OrderDetailComponent } from './pages/order-detail/order-detail.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProfileComponent } from './pages/profile/profile.component';
import { MyReviewsComponent } from './pages/my-reviews/my-reviews.component';
import { MyCouponsComponent } from './pages/my-coupons/my-coupons.component';
import { SharedModule } from '../../shared/shared.module';
@NgModule({
  declarations: [
    AddressesComponent,
    OrderListComponent,
    OrderDetailComponent,
    ProfileComponent,
    MyReviewsComponent,
    MyCouponsComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    AccountRoutingModule,
    SharedModule,
  ],
})
export class AccountModule {}
