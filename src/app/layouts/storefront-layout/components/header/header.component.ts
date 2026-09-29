import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from 'src/app/core/services/cart.service';
import { TokenService } from 'src/app/core/services/token.service';
import { WishlistService } from 'src/app/core/services/wishlist.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  readonly currentUser$ = this.authService.currentUser$;
  cartCount$ = this.cartService.cartCount$;
  wishlistCount$ = this.wishlistService.wishlistCount$;

  accountMenuOpen = false;
  mobileMenuOpen = false;
  searchKeyword = '';

  constructor(
    private readonly authService: AuthService,
    private tokenService: TokenService,
    private readonly router: Router,
    private readonly cartService: CartService,
    private readonly wishlistService: WishlistService,
    private readonly elementRef: ElementRef<HTMLElement>,
  ) {}

  ngOnInit(): void {
    if (this.tokenService.getToken()) {
      this.cartService.refreshCartCount();
      this.wishlistService.refreshWishlist();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.accountMenuOpen = false;
    }
  }

  toggleAccountMenu(event: Event): void {
    event.stopPropagation();
    this.accountMenuOpen = !this.accountMenuOpen;
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  getInitials(fullName: string | undefined): string {
    return (fullName || '?').trim().charAt(0).toUpperCase();
  }

  submitSearch(): void {
    const keyword = this.searchKeyword.trim();

    this.router.navigate(['/products'], {
      queryParams: keyword ? { keyword } : {},
    });

    this.closeMobileMenu();
  }

  logout(): void {
    this.authService.logout();
    this.accountMenuOpen = false;
    this.router.navigate(['/']);
  }
}
