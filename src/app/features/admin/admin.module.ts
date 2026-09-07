import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminRoutingModule } from './admin-routing.module';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { BrandsComponent } from './pages/brands/brands.component';
import { ColorsComponent } from './pages/colors/colors.component';
import { SizesComponent } from './pages/sizes/sizes.component';
import { ProductListAdminComponent } from './pages/products/product-list-admin/product-list-admin.component';
import { ProductFormComponent } from './pages/products/product-form/product-form.component';
import { CouponListComponent } from './pages/coupons/coupon-list/coupon-list.component';
import { CouponFormComponent } from './pages/coupons/coupon-form/coupon-form.component';
import { CouponUsagesComponent } from './pages/coupons/coupon-usages/coupon-usages.component';
import { ReactiveFormsModule } from '@angular/forms';
import { AdminOrderListComponent } from './pages/orders/admin-order-list/admin-order-list.component';
import { AdminOrderDetailComponent } from './pages/orders/admin-order-detail/admin-order-detail.component';
import { ReviewListComponent } from './pages/reviews/review-list/review-list.component';
import { UserListComponent } from './pages/users/user-list/user-list.component';
import { UserDetailComponent } from './pages/users/user-detail/user-detail.component';
import { SharedModule } from '../../shared/shared.module';
@NgModule({
  declarations: [
    DashboardComponent,
    CategoriesComponent,
    BrandsComponent,
    ColorsComponent,
    SizesComponent,
    ProductListAdminComponent,
    ProductFormComponent,
    CouponListComponent,
    CouponFormComponent,
    CouponUsagesComponent,
    AdminOrderListComponent,
    AdminOrderDetailComponent,
    ReviewListComponent,
    UserListComponent,
    UserDetailComponent,
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule,
  ],
})
export class AdminModule {}
