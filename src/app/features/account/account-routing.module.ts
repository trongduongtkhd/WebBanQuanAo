import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddressesComponent } from './pages/addresses/addresses.component';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { OrderDetailComponent } from './pages/order-detail/order-detail.component';
import { OrderListComponent } from './pages/order-list/order-list.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { MyReviewsComponent } from './pages/my-reviews/my-reviews.component';
const routes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        redirectTo: 'addresses',
        pathMatch: 'full',
      },

      {
        path: 'profile',
        component: ProfileComponent,
      },

      {
        path: 'addresses',
        component: AddressesComponent,
      },
      {
        path: 'orders',
        component: OrderListComponent,
      },
      {
        path: 'orders/:id',
        component: OrderDetailComponent,
      },
      {
        path: 'reviews',
        component: MyReviewsComponent,
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AccountRoutingModule {}
