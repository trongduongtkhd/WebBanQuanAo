import { Directive, ElementRef, HostListener, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

// Tối đa 13 chữ số để không vượt quá decimal(18,2) của database.
const MAX_DIGITS = 13;

const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

// Ô nhập tiền hiển thị dấu phẩy phân cách hàng nghìn (200000 -> 200,000)
// nhưng giá trị trong model vẫn là number (hoặc null khi để trống).
// Dùng được với cả [(ngModel)] và formControlName.
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

  constructor(private readonly elementRef: ElementRef<HTMLInputElement>) {}

  private get input(): HTMLInputElement {
    return this.elementRef.nativeElement;
  }

  writeValue(value: number | string | null | undefined): void {
    const numberValue =
      value === null || value === undefined || value === '' ? null : Number(value);

    this.input.value =
      numberValue === null || Number.isNaN(numberValue)
        ? ''
        : formatter.format(numberValue);
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

  @HostListener('input')
  onInput(): void {
    const rawValue = this.input.value;
    const caret = this.input.selectionStart ?? rawValue.length;

    // Đếm số chữ số nằm bên trái con trỏ để đặt lại con trỏ đúng chỗ sau khi thêm dấu phẩy.
    const digitsBeforeCaret = rawValue.slice(0, caret).replace(/\D/g, '').length;

    const digits = rawValue
      .replace(/\D/g, '')
      .replace(/^0+(?=\d)/, '')
      .slice(0, MAX_DIGITS);

    const value = digits ? Number(digits) : null;
    const formatted = value === null ? '' : formatter.format(value);

    this.input.value = formatted;
    this.restoreCaret(formatted, Math.min(digitsBeforeCaret, digits.length));

    this.onChange(value);
  }

  @HostListener('blur')
  onBlur(): void {
    this.onTouched();
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
