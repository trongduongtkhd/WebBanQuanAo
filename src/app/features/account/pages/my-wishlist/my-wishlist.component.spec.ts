import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyWishlistComponent } from './my-wishlist.component';

describe('MyWishlistComponent', () => {
  let component: MyWishlistComponent;
  let fixture: ComponentFixture<MyWishlistComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyWishlistComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyWishlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
