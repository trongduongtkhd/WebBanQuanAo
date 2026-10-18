import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
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
import { NotFoundComponent } from './features/not-found/not-found.component';
import { SharedModule } from './shared/shared.module';
import { AuthService } from './core/services/auth.service';

// Access token chỉ nằm trong bộ nhớ nên F5 sẽ mất: gọi /auth/refresh (cookie HttpOnly) để khôi phục phiên.
// Angular chờ Promise này xong mới bootstrap, nên router và các guard chạy SAU khi đã có access token.
export function restoreSessionFactory(authService: AuthService): () => Promise<void> {
  return () => authService.restoreSession();
}

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
    NotFoundComponent,
  ],
  imports: [BrowserModule, HttpClientModule, FormsModule, AppRoutingModule, SharedModule],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: restoreSessionFactory,
      deps: [AuthService],
      multi: true,
    },
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
