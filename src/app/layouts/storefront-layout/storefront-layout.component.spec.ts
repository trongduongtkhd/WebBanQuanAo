import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StorefrontLayoutComponent } from './storefront-layout.component';

describe('StorefrontLayoutComponent', () => {
  let component: StorefrontLayoutComponent;
  let fixture: ComponentFixture<StorefrontLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StorefrontLayoutComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StorefrontLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
