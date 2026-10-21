import { Directive, ElementRef, HostListener, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// Tối đa 13 chữ số để không vượt quá decimal(18,2) của database.
const MAX_DIGITS = 13;

const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

// Ô nhập tiền hiển thị dấu phẩy phân cách hàng nghìn ngay khi gõ (200000 -> 200,000)
// nhưng giá trị trong model vẫn là number (hoặc null khi để trống).
// Dùng được với cả [(ngModel)] và formControlName.
//
// Để không bị nhảy số (gõ 200000 ra 220,000):
// - writeValue (ngModel gọi lại sau mỗi lần gõ) không ghi đè ô khi giá trị không đổi.
// - Không đụng vào ô khi bộ gõ tiếng Việt đang ghép chữ (composition).
// - Chỉ gán lại input.value khi chuỗi hiển thị thực sự khác.
@Directive({
  selector: 'input[appMoneyInput]',
  host: {
    inputmode: 'numeric',
    autocomplete: 'off',
  },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MoneyInputDirective),
      multi: true,
    },
  ],
})
export class MoneyInputDirective implements ControlValueAccessor {
  private onChange: (value: number | null) => void = () => {};
  private onTouched: () => void = () => {};

  private value: number | null = null;
  private isComposing = false;

  constructor(private readonly elementRef: ElementRef<HTMLInputElement>) {}

  private get input(): HTMLInputElement {
    return this.elementRef.nativeElement;
  }

  writeValue(value: number | string | null | undefined): void {
    const numberValue =
      value === null || value === undefined || value === '' ? null : Number(value);
    const nextValue =
      numberValue === null || Number.isNaN(numberValue) ? null : numberValue;

    // Giá trị này chính là thứ ô vừa gửi lên: không ghi đè để khỏi làm lệch con trỏ.
    const hasText = this.input.value !== '';

    if (nextValue === this.value && hasText === (nextValue !== null)) {
      return;
    }

    this.value = nextValue;
    this.setDisplay(nextValue === null ? '' : formatter.format(nextValue));
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.input.disabled = isDisabled;
  }

  @HostListener('compositionstart')
  onCompositionStart(): void {
    this.isComposing = true;
  }

  @HostListener('compositionend')
  onCompositionEnd(): void {
    this.isComposing = false;
    this.onInput();
  }

  // Backspace/Delete ngay cạnh dấu phẩy: xoá luôn chữ số liền kề, nếu không dấu phẩy
  // sẽ bị xoá rồi format lại ngay và người dùng thấy như không xoá được gì.
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.isComposing || (event.key !== 'Backspace' && event.key !== 'Delete')) {
      return;
    }

    const { selectionStart, selectionEnd, value } = this.input;

    if (selectionStart === null || selectionStart !== selectionEnd) {
      return;
    }

    const commaIndex = event.key === 'Backspace' ? selectionStart - 1 : selectionStart;

    if (value[commaIndex] !== ',') {
      return;
    }

    event.preventDefault();

    const digitIndex = event.key === 'Backspace' ? commaIndex - 1 : commaIndex + 1;

    if (digitIndex < 0 || digitIndex >= value.length) {
      return;
    }

    this.input.value = value.slice(0, digitIndex) + value.slice(digitIndex + 1);
    this.input.setSelectionRange(digitIndex, digitIndex);
    this.onInput();
  }

  @HostListener('input')
  onInput(): void {
    if (this.isComposing) {
      return;
    }

    const rawValue = this.input.value;
    const caret = this.input.selectionStart ?? rawValue.length;

    // Đếm số chữ số nằm bên trái con trỏ để đặt lại con trỏ đúng chỗ sau khi thêm dấu phẩy.
    const digitsBeforeCaret = rawValue.slice(0, caret).replace(/\D/g, '').length;

    const digits = rawValue
      .replace(/\D/g, '')
      .replace(/^0+(?=\d)/, '')
      .slice(0, MAX_DIGITS);

    this.value = digits ? Number(digits) : null;
    const formatted = this.value === null ? '' : formatter.format(this.value);

    if (formatted !== rawValue) {
      this.input.value = formatted;
      this.restoreCaret(formatted, Math.min(digitsBeforeCaret, digits.length));
    }

    this.onChange(this.value);
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text') ?? '';

    // Bỏ phần thập phân kiểu "200000.50" / "200000,5" để không thành 20000050.
    // "200.000" hay "200,000" (3 chữ số sau dấu) vẫn hiểu là phân cách hàng nghìn.
    const cleaned = text.trim().replace(/[.,]\d{1,2}$/, '').replace(/\D/g, '');

    if (cleaned === text) {
      return;
    }

    event.preventDefault();
    const start = this.input.selectionStart ?? this.input.value.length;
    const end = this.input.selectionEnd ?? start;
    this.input.setRangeText(cleaned, start, end, 'end');
    this.onInput();
  }

  @HostListener('blur')
  onBlur(): void {
    this.isComposing = false;
    this.setDisplay(this.value === null ? '' : formatter.format(this.value));
    this.onTouched();
  }

  private setDisplay(text: string): void {
    if (this.input.value !== text) {
      this.input.value = text;
    }
  }

  private restoreCaret(formatted: string, digitsBeforeCaret: number): void {
    let position = 0;
    let digitCount = 0;

    while (position < formatted.length && digitCount < digitsBeforeCaret) {
      if (/\d/.test(formatted[position])) {
        digitCount++;
      }

      position++;
    }

    this.input.setSelectionRange(position, position);
  }
}
