import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../shared.module';


import { ProductCardComponent } from './product-card.component';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule, SharedModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    component.product = { productId: 1, productName: 'Test shirt', slug: 'test-shirt', categoryName: 'Shirts', basePrice: 100000, isFeatured: false };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
