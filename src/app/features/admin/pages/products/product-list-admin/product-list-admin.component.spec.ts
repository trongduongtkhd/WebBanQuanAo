import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../../../../shared/shared.module';


import { ProductListAdminComponent } from './product-list-admin.component';

describe('ProductListAdminComponent', () => {
  let component: ProductListAdminComponent;
  let fixture: ComponentFixture<ProductListAdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductListAdminComponent ],
      imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule, SharedModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductListAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
