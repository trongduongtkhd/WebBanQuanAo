import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../../../shared/shared.module';


import { MyReviewsComponent } from './my-reviews.component';

describe('MyReviewsComponent', () => {
  let component: MyReviewsComponent;
  let fixture: ComponentFixture<MyReviewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MyReviewsComponent ],
      imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule, SharedModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MyReviewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
