export interface CheckoutDraft {
  couponCode: string;
  note: string;
  paymentMethod: number;
}

export function readCheckoutDraft(value: unknown): CheckoutDraft | null {
  const draft = value as Partial<CheckoutDraft> | null;
  return draft && typeof draft.couponCode === 'string' && typeof draft.note === 'string' &&
    typeof draft.paymentMethod === 'number' && [1, 2, 3].includes(draft.paymentMethod)
    ? { couponCode: draft.couponCode, note: draft.note, paymentMethod: draft.paymentMethod }
    : null;
}

let initialDraft: { url: string; draft: CheckoutDraft } | null = null;
const currentUrl = (): string => window.location.pathname + window.location.search + window.location.hash;

// Router khởi tạo lại history.state khi F5. Giữ bản nháp trước lần điều hướng đầu tiên.
export function preserveCheckoutDraftFactory(): () => void {
  return () => {
    const draft = readCheckoutDraft(window.history.state?.checkoutDraft);
    initialDraft = draft ? { url: currentUrl(), draft } : null;
  };
}

export function takeCheckoutDraft(value: unknown): CheckoutDraft | null {
  const restored = initialDraft?.url === currentUrl() ? initialDraft.draft : null;
  initialDraft = null;
  return readCheckoutDraft(value) || restored;
}

// Luồng thêm địa chỉ chỉ được quay về checkout nội bộ, không nhận URL bên ngoài.
export function getCheckoutReturnUrl(value: string | null): string | null {
  return value && /^\/checkout(?:\?[^#\\\r\n]*)?(?:#[^\\\r\n]*)?$/.test(value) ? value : null;
}
