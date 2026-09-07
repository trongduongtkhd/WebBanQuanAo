import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CouponUsagesComponent } from './coupon-usages.component';

describe('CouponUsagesComponent', () => {
  let component: CouponUsagesComponent;
  let fixture: ComponentFixture<CouponUsagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CouponUsagesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CouponUsagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
