import { AbstractControl, ValidationErrors } from '@angular/forms';

// Chuỗi chỉ gồm khoảng trắng coi như để trống (Validators.required không bắt trường hợp này).
export function notBlank(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  return typeof value === 'string' && value.length > 0 && !value.trim()
    ? { required: true }
    : null;
}
