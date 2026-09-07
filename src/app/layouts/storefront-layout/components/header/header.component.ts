import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from 'src/app/core/services/cart.service';
import { TokenService } from 'src/app/core/services/token.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  readonly currentUser$ = this.authService.currentUser$;
  cartCount$ = this.cartService.cartCount$;
  constructor(
    private readonly authService: AuthService,
    private tokenService: TokenService,
    private readonly router: Router,
    private readonly cartService: CartService,
  ) {}
  ngOnInit(): void {
    if (this.tokenService.getToken()) {
      this.cartService.refreshCartCount();
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
