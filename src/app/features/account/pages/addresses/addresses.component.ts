import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
  Address,
  UpsertAddressRequest,
} from '../../../../core/models/address.model';
import { AddressService } from '../../../../core/services/address.service';

@Component({
  selector: 'app-addresses',
  templateUrl: './addresses.component.html',
  styleUrls: ['./addresses.component.scss'],
})
export class AddressesComponent implements OnInit {
  addresses: Address[] = [];

  loading = true;
  saving = false;
  changingDefaultId: number | null = null;
  deletingAddressId: number | null = null;

  showForm = false;
  editingAddressId: number | null = null;

  errorMessage = '';
  successMessage = '';

  addressForm = this.fb.group({
    receiverName: ['', [Validators.required, Validators.maxLength(150)]],
    receiverPhone: ['', [Validators.required, Validators.maxLength(20)]],

    addressDetail: ['', [Validators.required, Validators.maxLength(500)]],
    ward: ['', Validators.maxLength(100)],
    district: ['', Validators.maxLength(100)],
    province: ['', [Validators.required, Validators.maxLength(100)]],

    isDefault: [false],
  });

  constructor(
    private fb: FormBuilder,
    private addressService: AddressService,
  ) {}

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.loading = true;
    this.errorMessage = '';

    this.addressService.getMyAddresses().subscribe({
      next: (response) => {
        this.addresses = response.data || [];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage =
          error?.error?.message || 'Không thể tải danh sách địa chỉ.';
      },
    });
  }

  openCreateForm(): void {
    this.editingAddressId = null;
    this.successMessage = '';
    this.errorMessage = '';

    this.addressForm.reset({
      receiverName: '',
      receiverPhone: '',
      addressDetail: '',
      ward: '',
      district: '',
      province: '',
      isDefault: this.addresses.length === 0,
    });

    this.showForm = true;
  }

  openEditForm(address: Address): void {
    this.editingAddressId = address.addressId;
    this.successMessage = '';
    this.errorMessage = '';

    this.addressForm.patchValue({
      receiverName: address.receiverName,
      receiverPhone: address.receiverPhone,

      addressDetail: address.addressDetail,
      ward: address.ward || '',
      district: address.district || '',
      province: address.province,

      isDefault: address.isDefault,
    });

    this.showForm = true;
  }

  closeForm(): void {
    if (this.saving) {
      return;
    }

    this.showForm = false;
    this.editingAddressId = null;
  }

  saveAddress(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.addressForm.invalid) {
      this.addressForm.markAllAsTouched();
      return;
    }

    const value = this.addressForm.value;

    const request: UpsertAddressRequest = {
      receiverName: value.receiverName!.trim(),
      receiverPhone: value.receiverPhone!.trim(),

      addressDetail: value.addressDetail!.trim(),
      ward: value.ward?.trim() || null,
      district: value.district?.trim() || null,
      province: value.province!.trim(),

      isDefault: !!value.isDefault,
    };

    this.saving = true;

    const request$ = this.editingAddressId
      ? this.addressService.update(this.editingAddressId, request)
      : this.addressService.create(request);

    request$.subscribe({
      next: (response) => {
        this.saving = false;
        this.showForm = false;

        this.successMessage = response.message;
        this.loadAddresses();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error?.error?.message || 'Không thể lưu địa chỉ.';
      },
    });
  }

  setDefault(address: Address): void {
    if (address.isDefault) {
      return;
    }

    this.changingDefaultId = address.addressId;

    this.addressService.setDefault(address.addressId).subscribe({
      next: (response) => {
        this.changingDefaultId = null;
        this.successMessage = response.message;
        this.loadAddresses();
      },
      error: (error) => {
        this.changingDefaultId = null;
        this.errorMessage =
          error?.error?.message || 'Không thể đặt địa chỉ mặc định.';
      },
    });
  }

  deleteAddress(address: Address): void {
    const confirmed = window.confirm(
      `Bạn có muốn xóa địa chỉ của "${address.receiverName}" không?`,
    );

    if (!confirmed) {
      return;
    }

    this.deletingAddressId = address.addressId;

    this.addressService.delete(address.addressId).subscribe({
      next: (response) => {
        this.deletingAddressId = null;
        this.successMessage = response.message;
        this.loadAddresses();
      },
      error: (error) => {
        this.deletingAddressId = null;
        this.errorMessage = error?.error?.message || 'Không thể xóa địa chỉ.';
      },
    });
  }

  getAddressText(address: Address): string {
    return [
      address.addressDetail,
      address.ward,
      address.district,
      address.province,
    ]
      .filter(Boolean)
      .join(', ');
  }

  isInvalid(controlName: string): boolean {
    const control = this.addressForm.get(controlName);

    return !!control && control.invalid && (control.touched || control.dirty);
  }
}
