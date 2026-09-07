import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { CategoriesComponent } from './pages/categories/categories.component';
import { BrandsComponent } from './pages/brands/brands.component';
import { ColorsComponent } from './pages/colors/colors.component';
import { SizesComponent } from './pages/sizes/sizes.component';
import { ProductFormComponent } from './pages/products/product-form/product-form.component';
import { ProductListAdminComponent } from './pages/products/product-list-admin/product-list-admin.component';
import { CouponListComponent } from './pages/coupons/coupon-list/coupon-list.component';
import { CouponFormComponent } from './pages/coupons/coupon-form/coupon-form.component';
import { CouponUsagesComponent } from './pages/coupons/coupon-usages/coupon-usages.component';
import { ReviewListComponent } from './pages/reviews/review-list/review-list.component';
import { AdminOrderListComponent } from './pages/orders/admin-order-list/admin-order-list.component';
import { AdminOrderDetailComponent } from './pages/orders/admin-order-detail/admin-order-detail.component';
import { UserDetailComponent } from './pages/users/user-detail/user-detail.component';
import { UserListComponent } from './pages/users/user-list/user-list.component';
const routes: Routes = [
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'categories',
    component: CategoriesComponent,
  },
  {
    path: 'brands',
    component: BrandsComponent,
  },
  {
    path: 'colors',
    component: ColorsComponent,
  },
  {
    path: 'sizes',
    component: SizesComponent,
  },
  {
    path: 'products',
    component: ProductListAdminComponent,
  },
  {
    path: 'products/create',
    component: ProductFormComponent,
  },
  {
    path: 'products/:id/edit',
    component: ProductFormComponent,
  },
  {
    path: 'coupons',
    component: CouponListComponent,
  },
  {
    path: 'coupons/create',
    component: CouponFormComponent,
  },
  {
    path: 'coupons/:id/edit',
    component: CouponFormComponent,
  },
  {
    path: 'coupons/:id/usages',
    component: CouponUsagesComponent,
  },
  {
    path: 'orders',
    component: AdminOrderListComponent,
  },
  {
    path: 'orders/:id',
    component: AdminOrderDetailComponent,
  },
  {
    path: 'reviews',
    component: ReviewListComponent,
  },
  {
    path: 'users',
    component: UserListComponent,
  },

  {
    path: 'users/:id',
    component: UserDetailComponent,
  },

  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
