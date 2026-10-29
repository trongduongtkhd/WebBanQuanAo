import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { AdminHeaderComponent } from './components/admin-header/admin-header.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';

import { AdminLayoutComponent } from './admin-layout.component';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AdminLayoutComponent, AdminHeaderComponent, AdminSidebarComponent ],
      imports: [CommonModule, HttpClientTestingModule, RouterTestingModule],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
