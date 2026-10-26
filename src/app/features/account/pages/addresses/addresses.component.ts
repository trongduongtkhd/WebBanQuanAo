import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Address,
  UpsertAddressRequest,
} from '../../../../core/models/address.model';
import { AddressService } from '../../../../core/services/address.service';
import { getApiErrorMessage } from '../../../../core/utils/api-error.util';
import { CheckoutDraft, getCheckoutReturnUrl, takeCheckoutDraft } from '../../../../core/utils/checkout-navigation.util';

// Giới hạn độ dài khớp [StringLength] ở UpsertAddressDto (backend).
const ADDRESS_FIELDS = {
  receiverName: { label: 'Tên người nhận', max: 150 },
  receiverPhone: { label: 'Số điện thoại', max: 20 },
  addressDetail: { label: 'Địa chỉ chi tiết', max: 500 },
  ward: { label: 'Phường/Xã', max: 100 },
  district: { label: 'Quận/Huyện', max: 100 },
  province: { label: 'Tỉnh/Thành phố', max: 100 },
} as const;

type AddressFieldName = keyof typeof ADDRESS_FIELDS;

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
  checkoutReturnUrl: string | null = null;
  private checkoutDraft: CheckoutDraft | null = null;
  private openCreateOnLoad = false;

  addressForm = this.fb.group({
    receiverName: [
      '',
      [Validators.required, Validators.maxLength(ADDRESS_FIELDS.receiverName.max)],
    ],
    receiverPhone: [
      '',
      [Validators.required, Validators.maxLength(ADDRESS_FIELDS.receiverPhone.max)],
    ],

    addressDetail: [
      '',
      [Validators.required, Validators.maxLength(ADDRESS_FIELDS.addressDetail.max)],
    ],
    ward: ['', Validators.maxLength(ADDRESS_FIELDS.ward.max)],
    district: ['', Validators.maxLength(ADDRESS_FIELDS.district.max)],
    province: [
      '',
      [Validators.required, Validators.maxLength(ADDRESS_FIELDS.province.max)],
    ],

    isDefault: [false],
  });

  constructor(
    private fb: FormBuilder,
    private addressService: AddressService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.checkoutReturnUrl = getCheckoutReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
    const state = this.router.getCurrentNavigation()?.extras.state || window.history.state;
    this.checkoutDraft = takeCheckoutDraft(state?.checkoutDraft);
    this.openCreateOnLoad = !!this.checkoutReturnUrl && this.route.snapshot.queryParamMap.get('create') === '1';
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.loading = true;
    this.errorMessage = '';

    this.addressService.getMyAddresses().subscribe({
      next: (response) => {
        this.addresses = response.data || [];
        this.loading = false;
        if (this.openCreateOnLoad) {
          this.openCreateOnLoad = false;
          this.openCreateForm();
        }
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
    if (this.saving) return;
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
        if (this.checkoutReturnUrl) {
          this.returnToCheckout(response.data.addressId);
          return;
        }
        this.loadAddresses();
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = getApiErrorMessage(error, 'Không thể lưu địa chỉ.');
      },
    });
  }

  returnToCheckout(addressId?: number): void {
    if (!this.checkoutReturnUrl || this.saving) return;
    const url = this.router.parseUrl(this.checkoutReturnUrl);
    if (addressId) url.queryParams = { ...url.queryParams, addressId };
    this.router.navigateByUrl(url, { state: { checkoutDraft: this.checkoutDraft } });
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

  getFieldError(controlName: AddressFieldName): string {
    const errors = this.addressForm.get(controlName)?.errors;
    const field = ADDRESS_FIELDS[controlName];

    if (errors?.['required']) {
      return `Vui lòng nhập ${field.label.toLowerCase()}.`;
    }

    if (errors?.['maxlength']) {
      return `${field.label} tối đa ${field.max} ký tự.`;
    }

    return '';
  }

  isInvalid(controlName: string): boolean {
    const control = this.addressForm.get(controlName);

    return !!control && control.invalid && (control.touched || control.dirty);
  }
}
