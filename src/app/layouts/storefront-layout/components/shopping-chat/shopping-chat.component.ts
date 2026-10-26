import { AfterViewChecked, Component, ElementRef, HostListener, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ChatMessage, ChatProduct } from '../../../../core/models/chat.model';
import { ChatService } from '../../../../core/services/chat.service';

@Component({
  selector: 'app-shopping-chat',
  templateUrl: './shopping-chat.component.html',
  styleUrls: ['./shopping-chat.component.scss'],
})
export class ShoppingChatComponent implements AfterViewChecked, OnDestroy {
  @ViewChild('messageList') private messageList?: ElementRef<HTMLElement>;
  @ViewChild('messageInput') private messageInput?: ElementRef<HTMLTextAreaElement>;
  @ViewChild('launcher') private launcher?: ElementRef<HTMLButtonElement>;

  isOpen = false;
  isSending = false;
  draft = '';
  errorMessage = '';
  messages: ChatMessage[] = [];
  suggestions = ['Tìm áo dưới 200 nghìn', 'Kiểm tra màu và size', 'Phí vận chuyển', 'Chính sách trả hàng'];
  private readonly storageKey = 'clothing.shopping-chat.v1';
  private request?: Subscription;
  private shouldScroll = false;
  private shouldFocus = false;
  private lastProductIds: number[] = [];
  private failedMessage = '';

  constructor(private readonly chat: ChatService, private readonly router: Router) {
    this.restore();
  }

  get productSlug(): string | null {
    const path = this.router.url.split(/[?#]/)[0];
    const match = path.match(/^\/products\/([^/]+)$/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  toggle(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.shouldScroll = true;
      this.shouldFocus = true;
    } else {
      this.launcher?.nativeElement.focus();
    }
  }

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.isOpen) this.toggle();
  }

  @HostListener('window:resize')
  onResize(): void {
    if (this.isOpen) this.shouldScroll = true;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll && this.messageList) {
      const list = this.messageList.nativeElement;
      list.scrollTop = list.scrollHeight;
      this.shouldScroll = false;
    }
    if (this.shouldFocus && this.messageInput) {
      this.messageInput.nativeElement.focus();
      this.shouldFocus = false;
    }
  }

  onEnter(event: Event): void {
    const keyboard = event as KeyboardEvent;
    if (!keyboard.shiftKey && !keyboard.isComposing) {
      keyboard.preventDefault();
      this.send();
    }
  }

  askAboutProduct(): void {
    this.send('Cho tôi thông tin, màu và size của sản phẩm này.');
  }

  send(text = this.draft): void {
    const message = text.trim();
    if (!message || message.length > 1000 || this.isSending) return;
    const history = this.messages.slice(-8).map(item => ({ role: item.role, content: item.content.slice(0, 600) }));
    this.messages.push({ role: 'user', content: message });
    this.draft = '';
    this.failedMessage = '';
    this.errorMessage = '';
    this.isSending = true;
    this.shouldScroll = true;
    this.persist();
    this.request = this.chat.send({ message, history, productIds: this.lastProductIds, productSlug: this.productSlug }).subscribe({
      next: response => {
        if (!response.success || !response.data) {
          this.handleError(response.message, message);
          return;
        }
        this.messages.push({ role: 'assistant', content: response.data.reply, products: response.data.products });
        if (response.data.products.length) this.lastProductIds = response.data.products.map(product => product.productId);
        this.suggestions = response.data.suggestions;
        this.isSending = false;
        this.shouldScroll = true;
        this.persist();
      },
      error: error => this.handleError(error?.error?.message ||
        (error?.name === 'TimeoutError' ? 'Trợ lý đang xử lý chậm. Bạn thử lại hoặc tìm sản phẩm bằng bộ lọc nhé.' :
          'Chưa kết nối được với trợ lý. Bạn vẫn có thể xem và mua sản phẩm bình thường.'), message),
    });
  }

  retry(): void {
    if (!this.failedMessage || this.isSending) return;
    const message = this.failedMessage;
    if (this.messages[this.messages.length - 1]?.role === 'user') this.messages.pop();
    this.send(message);
  }

  newConversation(): void {
    this.request?.unsubscribe();
    this.isSending = false;
    this.messages = [];
    this.lastProductIds = [];
    this.draft = '';
    this.errorMessage = '';
    this.failedMessage = '';
    this.suggestions = ['Tìm áo dưới 200 nghìn', 'Kiểm tra màu và size', 'Phí vận chuyển', 'Chính sách trả hàng'];
    this.shouldFocus = true;
    this.persist();
  }

  hasStock(product: ChatProduct): boolean {
    return product.variants.some(variant => variant.stockQuantity > 0);
  }

  ngOnDestroy(): void {
    this.request?.unsubscribe();
  }

  private handleError(message: string, failedMessage: string): void {
    this.isSending = false;
    this.errorMessage = message;
    this.failedMessage = failedMessage;
    this.shouldScroll = true;
  }

  private persist(): void {
    try {
      sessionStorage.setItem(this.storageKey, JSON.stringify({
        messages: this.messages.slice(-20), productIds: this.lastProductIds,
      }));
    } catch { /* Chat vẫn hoạt động khi trình duyệt không cho lưu session. */ }
  }

  private restore(): void {
    try {
      const saved = JSON.parse(sessionStorage.getItem(this.storageKey) || 'null');
      if (!saved || !Array.isArray(saved.messages)) return;
      this.messages = saved.messages.slice(-20)
        .filter((item: ChatMessage) => ['user', 'assistant'].includes(item?.role) && typeof item.content === 'string')
        .map((item: ChatMessage) => ({ role: item.role, content: item.content.slice(0, 5000),
          products: Array.isArray(item.products) ? item.products.slice(0, 5).filter(product =>
            Number.isInteger(product?.productId) && product.productId > 0 &&
            typeof product.productName === 'string' && typeof product.slug === 'string' &&
            Number.isFinite(product.minPrice) && Number.isFinite(product.maxPrice) &&
            product.minPrice >= 0 && product.maxPrice >= product.minPrice && Array.isArray(product.variants),
          ).map(product => ({ ...product, variants: product.variants.filter(variant =>
            typeof variant?.color === 'string' && typeof variant.size === 'string' &&
            Number.isFinite(variant.price) && Number.isFinite(variant.stockQuantity),
          ).slice(0, 50) })) : undefined,
        }));
      this.lastProductIds = Array.isArray(saved.productIds)
        ? saved.productIds.filter((id: number) => Number.isInteger(id) && id > 0).slice(0, 5) : [];
    } catch { /* Bỏ qua lịch sử không hợp lệ. */ }
  }
}
