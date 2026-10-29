import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../shared/shared.module';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ShoppingChatComponent } from './components/shopping-chat/shopping-chat.component';

import { StorefrontLayoutComponent } from './storefront-layout.component';

describe('StorefrontLayoutComponent', () => {
  let component: StorefrontLayoutComponent;
  let fixture: ComponentFixture<StorefrontLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StorefrontLayoutComponent, HeaderComponent, FooterComponent, ShoppingChatComponent ],
      imports: [CommonModule, FormsModule, HttpClientTestingModule, RouterTestingModule, SharedModule],
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
