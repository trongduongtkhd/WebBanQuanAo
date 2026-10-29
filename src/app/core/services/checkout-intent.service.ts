import { Injectable } from '@angular/core';
import { CreateOrderRequest } from '../models/checkout.model';
import { TokenService } from './token.service';

export interface PendingCheckout { payload: CreateOrderRequest; }

@Injectable({ providedIn: 'root' })
export class CheckoutIntentService {
  constructor(private tokens: TokenService) {}

  private get key(): string { return `clothing_pending_checkout_${this.tokens.getUser()?.userId ?? 0}`; }

  newId(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64;
    bytes[8] = (bytes[8] & 63) | 128;
    const s = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
  }

  read(): PendingCheckout | null {
    try {
      const pending = JSON.parse(sessionStorage.getItem(this.key) || 'null');
      return pending?.payload && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(pending.payload.requestId)
        ? pending : null;
    } catch { return null; }
  }

  save(payload: CreateOrderRequest): void {
    sessionStorage.setItem(this.key, JSON.stringify({ payload }));
  }

  clear(requestId?: string): void {
    if (!requestId || this.read()?.payload.requestId === requestId) sessionStorage.removeItem(this.key);
  }
}
