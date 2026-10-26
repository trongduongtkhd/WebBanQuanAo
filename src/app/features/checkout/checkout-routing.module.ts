import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from 'src/app/core/guards/auth.guard';
import { CheckoutComponent } from './pages/checkout/checkout.component';
import { VnpayResultComponent } from './pages/vnpay-result/vnpay-result.component';
const routes: Routes = [
  {
    path: 'vnpay-result',
    component: VnpayResultComponent,
    canActivate: [AuthGuard],
  },
  {
    path: '',
    component: CheckoutComponent,
    canActivate: [AuthGuard],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CheckoutRoutingModule {}
