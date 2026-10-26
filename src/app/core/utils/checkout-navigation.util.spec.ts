import { getCheckoutReturnUrl, preserveCheckoutDraftFactory, readCheckoutDraft, takeCheckoutDraft } from './checkout-navigation.util';

describe('Checkout navigation state', () => {
  const draft = { couponCode: 'SAVE10', note: 'Giao buổi sáng', paymentMethod: 2 };
  let originalState: unknown;
  beforeEach(() => originalState = window.history.state);
  afterEach(() => {
    takeCheckoutDraft(null);
    window.history.replaceState(originalState, '');
  });

  it('retains a valid draft across the router initial history replacement exactly once', () => {
    window.history.replaceState({ checkoutDraft: draft }, '');
    preserveCheckoutDraftFactory()();
    window.history.replaceState({ navigationId: 1 }, '');
    expect(takeCheckoutDraft(undefined)).toEqual(draft);
    expect(takeCheckoutDraft(undefined)).toBeNull();
  });

  it('accepts checkout return URLs and rejects external, unrelated or malformed paths', () => {
    expect(getCheckoutReturnUrl('/checkout?buyNow=5&qty=2&slug=test')).not.toBeNull();
    ['/cart', '//example.com/checkout', 'https://example.com/checkout', '/checkout-other', '/checkout\\evil'].forEach(url => {
      expect(getCheckoutReturnUrl(url)).toBeNull();
    });
  });

  it('ignores invalid drafts instead of carrying unexpected payment or field types', () => {
    expect(readCheckoutDraft({ ...draft, paymentMethod: 99 })).toBeNull();
    expect(readCheckoutDraft({ ...draft, note: 123 })).toBeNull();
    expect(readCheckoutDraft(null)).toBeNull();
  });
});
