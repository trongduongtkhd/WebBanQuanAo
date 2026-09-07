import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';

import {
  PublicCategory,
  PublicProduct,
} from '../../../core/models/catalog.model';
import { CatalogService } from '../../../core/services/catalog.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  categories: PublicCategory[] = [];
  featuredProducts: PublicProduct[] = [];
  newArrivalProducts: PublicProduct[] = [];

  isLoading = true;
  errorMessage = '';

  constructor(private readonly catalogService: CatalogService) {}

  ngOnInit(): void {
    this.loadHomeData();
  }

  private loadHomeData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      categories: this.catalogService.getCategories(),
      featured: this.catalogService.getFeaturedProducts(8),
      newArrivals: this.catalogService.getNewArrivalProducts(8),
    }).subscribe({
      next: (result) => {
        this.categories = result.categories.data;
        this.featuredProducts = result.featured.data;
        this.newArrivalProducts = result.newArrivals.data;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Không thể tải dữ liệu trang chủ.';
        this.isLoading = false;
      },
    });
  }
}
