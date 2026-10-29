import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { SharedModule } from '../../../../shared/shared.module';

import { OrderDetailComponent } from './order-detail.component';

describe('OrderDetailComponent', () => {
  let component: OrderDetailComponent;
  let fixture: ComponentFixture<OrderDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OrderDetailComponent ],
      imports: [CommonModule, FormsModule, HttpClientTestingModule, RouterTestingModule, SharedModule],
      providers: [{ provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({id:'101'}) } } }],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(r => r.url.endsWith('/orders/101'))
      .flush({ success: true, data: { orderId:101, orderCode:'TEST-101', orderStatus:1,
        paymentStatus:1, items:[], payments:[], statusHistories:[] } });
    fixture.detectChanges();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
