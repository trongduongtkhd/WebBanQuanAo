import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { StorefrontLayoutComponent } from './layouts/storefront-layout/storefront-layout.component';
import { HeaderComponent } from './layouts/storefront-layout/components/header/header.component';
import { FooterComponent } from './layouts/storefront-layout/components/footer/footer.component';
import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AdminSidebarComponent } from './layouts/admin-layout/components/admin-sidebar/admin-sidebar.component';
import { AdminHeaderComponent } from './layouts/admin-layout/components/admin-header/admin-header.component';
import { ForbiddenComponent } from './features/forbidden/forbidden.component';

@NgModule({
  declarations: [
    AppComponent,
    StorefrontLayoutComponent,
    AuthLayoutComponent,
    HeaderComponent,
    FooterComponent,
    AdminLayoutComponent,
    AdminSidebarComponent,
    AdminHeaderComponent,
    ForbiddenComponent,
  ],
  imports: [BrowserModule, HttpClientModule, AppRoutingModule],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
