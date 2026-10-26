import { AbstractControl, ValidationErrors } from '@angular/forms';

export const FULL_NAME_MESSAGE = 'Họ tên phải có từ 2 đến 150 ký tự, chỉ gồm chữ cái, khoảng trắng, dấu nháy hoặc gạch nối giữa các phần tên.';
export const PHONE_MESSAGE = 'Nhập số di động Việt Nam có 10 chữ số, đầu 03, 05, 07, 08 hoặc 09; có thể dùng +84 thay số 0.';
export const PASSWORD_MESSAGE = 'Mật khẩu cần ít nhất 8 ký tự, ký tự đầu viết hoa, có số 0–9 và ký tự đặc biệt.';
export const PASSWORD_RULES = [
  { key: 'minLength', label: 'Ít nhất 8 ký tự' },
  { key: 'firstUppercase', label: 'Ký tự đầu tiên viết hoa' },
  { key: 'digit', label: 'Có ít nhất 1 chữ số (0–9)' },
  { key: 'special', label: 'Có ít nhất 1 ký tự đặc biệt (@, !, #, $...)' },
  { key: 'maxBytes', label: 'Độ dài trong giới hạn cho phép' },
  { key: 'hiddenCharacters', label: 'Không chứa ký tự điều khiển hoặc ký tự ẩn' },
];

// Match the API rules; normalize contact fields, never trim/normalize a password.
const NAME_PATTERN = /^\p{L}[\p{L}\p{M}]*(?:[ '\u2019-]\p{L}[\p{L}\p{M}]*)*$/u;
const EMAIL_PATTERN = /^(?=.{1,254}$)(?=.{1,64}@)[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,63}$/;

export function normalizeFullName(value: string): string {
  return value.length > 1000 ? value : value.normalize('NFC').replace(/^ +| +$/g, '').replace(/ +/g, ' ');
}

export function normalizeEmail(value: string): string {
  return value.replace(/^ +| +$/g, '').toLowerCase();
}

export function normalizePhone(value: string | null | undefined): string | null {
  const raw = (value ?? '').replace(/^ +| +$/g, '');
  if (!raw) { return null; }
  if (raw.length > 32 || !/^\+?[0-9]+(?:[ .-][0-9]+)*$/.test(raw) || /[\r\n]/.test(raw)) { return raw; }
  return raw.replace(/[ .-]/g, '').replace(/^\+84/, '0');
}

export function personNameValidator(control: AbstractControl): ValidationErrors | null {
  const name = normalizeFullName(control.value ?? '');
  if (!name) { return { required: true }; }
  return name.length >= 2 && name.length <= 150 && (name.match(/\p{L}/gu) ?? []).length >= 2 &&
    NAME_PATTERN.test(name) && !/[\r\n]/.test(name) ? null : { personName: true };
}

export function vietnameseMobileValidator(control: AbstractControl): ValidationErrors | null {
  const phone = normalizePhone(control.value);
  return phone === null || /^0[35789][0-9]{8}$/.test(phone) && !/[\r\n]/.test(phone) ? null : { phoneNumber: true };
}

export function accountEmailValidator(control: AbstractControl): ValidationErrors | null {
  const email = normalizeEmail(control.value ?? '');
  if (!email) { return { required: true }; }
  return email.length <= 254 && EMAIL_PATTERN.test(email) && !/[\r\n]/.test(email) ? null : { email: true };
}

export function strongPasswordValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value ?? '';
  if (!value) { return null; }
  const errors: ValidationErrors = {};
  if (value.length < 8) { errors.minLength = true; }
  if (!/^\p{Lu}/u.test(value)) { errors.firstUppercase = true; }
  if (!/[0-9]/.test(value)) { errors.digit = true; }
  if (!/[\p{P}\p{S}]/u.test(value)) { errors.special = true; }
  if (new TextEncoder().encode(value).length > 72) { errors.maxBytes = true; }
  if (/[\p{Cc}\p{Cf}]/u.test(value)) { errors.hiddenCharacters = true; }
  return Object.keys(errors).length ? errors : null;
}

export function passwordErrorMessage(control: AbstractControl | null): string {
  if (control?.hasError('required')) { return 'Vui lòng nhập mật khẩu.'; }
  if (control?.hasError('maxBytes')) { return 'Mật khẩu quá dài. Vui lòng dùng mật khẩu ngắn hơn.'; }
  if (control?.hasError('hiddenCharacters')) { return 'Mật khẩu không được chứa ký tự điều khiển hoặc ký tự ẩn.'; }
  return PASSWORD_MESSAGE;
}
