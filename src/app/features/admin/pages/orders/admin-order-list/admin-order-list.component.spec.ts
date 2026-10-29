import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../../../../shared/shared.module';


import { AdminOrderListComponent } from './admin-order-list.component';

describe('AdminOrderListComponent', () => {
  let component: AdminOrderListComponent;
  let fixture: ComponentFixture<AdminOrderListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminOrderListComponent ],
      imports: [CommonModule, FormsModule, ReactiveFormsModule, HttpClientTestingModule, RouterTestingModule, SharedModule]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminOrderListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
