import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../../../../shared/shared.module';

import { PurchaseOrderFormComponent } from './purchase-order-form.component';

describe('PurchaseOrderFormComponent', () => {
  let component: PurchaseOrderFormComponent;
  let fixture: ComponentFixture<PurchaseOrderFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PurchaseOrderFormComponent ],
      imports: [CommonModule, FormsModule, HttpClientTestingModule, RouterTestingModule, SharedModule],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PurchaseOrderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(r => r.url.endsWith('/admin/suppliers'))
      .flush({ success: true, data: [] });
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
