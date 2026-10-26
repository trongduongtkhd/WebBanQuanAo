import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { ChatService } from '../../../../core/services/chat.service';
import { ShoppingChatComponent } from './shopping-chat.component';

@Pipe({ name: 'imageUrl' })
class ImageUrlStub implements PipeTransform { transform(value: string): string { return value; } }

describe('ShoppingChatComponent', () => {
  let fixture: ComponentFixture<ShoppingChatComponent>;
  let component: ShoppingChatComponent;
  let chat: jasmine.SpyObj<ChatService>;
  let route: { url: string };
  const storageKey = 'clothing.shopping-chat.v1';
  const product = { productId: 9, productName: 'Áo Polo', slug: 'ao-polo', minPrice: 150000, maxPrice: 150000,
    categoryName: 'Áo Nam', variants: [{ color: 'Be', size: 'M', stockQuantity: 5, price: 150000 }] };
  const response = { success: true, message: '', data: { reply: 'Áo Polo còn size M.', products: [product], suggestions: ['Phí vận chuyển'], usedAi: true } };

  beforeEach(async () => {
    sessionStorage.removeItem(storageKey);
    chat = jasmine.createSpyObj('ChatService', ['send']);
    chat.send.and.returnValue(of(response));
    route = { url: '/products' };
    await TestBed.configureTestingModule({
      imports: [FormsModule], declarations: [ShoppingChatComponent, ImageUrlStub],
      providers: [{ provide: ChatService, useValue: chat }, { provide: Router, useValue: route }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(ShoppingChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => { fixture.destroy(); sessionStorage.removeItem(storageKey); });

  it('opens an accessible chat panel and closes with Escape', () => {
    expect(fixture.nativeElement.querySelector('[role=dialog]')).toBeNull();
    component.toggle(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=dialog]').textContent).toContain('Trợ lý mua sắm');
    expect(fixture.nativeElement.querySelector('textarea')).toBe(document.activeElement);
    component.closeOnEscape(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=dialog]')).toBeNull();
  });

  it('sends a trimmed message and renders actual product cards', () => {
    component.toggle(); component.draft = '  Tìm áo polo  '; component.send(); fixture.detectChanges();
    expect(chat.send).toHaveBeenCalledWith({ message: 'Tìm áo polo', history: [], productIds: [], productSlug: null });
    expect(component.draft).toBe('');
    expect(fixture.nativeElement.querySelector('.chat-product').textContent).toContain('Áo Polo');
    expect(fixture.nativeElement.querySelector('.availability').textContent).toContain('Còn hàng');
  });

  it('keeps displayed product IDs and bounded history for follow-up questions', () => {
    component.send('Tìm áo'); component.send('Cái đầu tiên còn size nào?');
    const request = chat.send.calls.mostRecent().args[0];
    expect(request.productIds).toEqual([9]);
    expect(request.history.map(item => item.role)).toEqual(['user', 'assistant']);
    expect(request.history[0].content).toBe('Tìm áo');
  });

  it('includes the current product context without requiring login', () => {
    route.url = '/products/ao-polo?from=home';
    component.askAboutProduct();
    expect(chat.send.calls.mostRecent().args[0].productSlug).toBe('ao-polo');
  });

  it('prevents empty, oversized and duplicate sends while loading', () => {
    const pending = new Subject<any>(); chat.send.and.returnValue(pending);
    component.send(' '); component.send('a'.repeat(1001));
    expect(chat.send).not.toHaveBeenCalled();
    component.send('Tìm áo'); component.send('Tìm quần');
    expect(chat.send).toHaveBeenCalledTimes(1);
    expect(component.isSending).toBeTrue();
    pending.next(response);
    expect(component.isSending).toBeFalse();
  });

  it('shows an unavailable message and retries without duplicating the question', () => {
    chat.send.and.returnValue(throwError({ status: 503, error: { message: 'Trợ lý đang bận' } }));
    component.send('Tìm áo');
    expect(component.errorMessage).toBe('Trợ lý đang bận');
    chat.send.and.returnValue(of(response)); component.retry();
    expect(component.messages.filter(message => message.role === 'user').length).toBe(1);
    expect(component.errorMessage).toBe('');
  });

  it('cancels a request when starting a new conversation and ignores its late response', () => {
    const pending = new Subject<any>(); chat.send.and.returnValue(pending);
    component.send('Tìm áo'); component.newConversation(); pending.next(response);
    expect(component.messages).toEqual([]);
    expect(component.isSending).toBeFalse();
  });

  it('renders untrusted assistant text as text, without executing HTML', () => {
    chat.send.and.returnValue(of({ ...response, data: { ...response.data, reply: '<img src=x onerror=alert(1)>' } }));
    component.toggle(); component.send('Tìm áo'); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.message-bubble img')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('keeps Shift+Enter and IME composition from submitting', () => {
    component.draft = 'Tìm áo';
    component.onEnter(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));
    component.onEnter(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true }));
    expect(chat.send).not.toHaveBeenCalled();
    component.onEnter(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(chat.send).toHaveBeenCalledTimes(1);
  });

  it('restores only valid session messages and keeps product context', () => {
    component.send('Tìm áo');
    const restored = new ShoppingChatComponent(chat, route as Router);
    expect(restored.messages.length).toBe(2);
    expect(restored.messages[1].products?.[0].productId).toBe(9);
    restored.send('Cái đầu tiên');
    expect(chat.send.calls.mostRecent().args[0].productIds).toEqual([9]);
    restored.ngOnDestroy();
    sessionStorage.setItem(storageKey, '{bad json');
    expect(() => new ShoppingChatComponent(chat, route as Router)).not.toThrow();
  });
});
