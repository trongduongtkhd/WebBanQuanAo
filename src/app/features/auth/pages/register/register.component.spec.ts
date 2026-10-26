import { Component, EventEmitter, Output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Subject } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterComponent } from './register.component';

@Component({ selector: 'app-turnstile', template: '' })
class TurnstileStub {
  @Output() tokenChange = new EventEmitter<string>();
}

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let auth: jasmine.SpyObj<AuthService>;
  let request: Subject<any>;

  beforeEach(async () => {
    request = new Subject();
    auth = jasmine.createSpyObj('AuthService', ['register']);
    auth.register.and.returnValue(request);
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [RegisterComponent, TurnstileStub],
      providers: [{ provide: AuthService, useValue: auth }],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function validForm(): void {
    component.registerForm.setValue({ fullName: 'Nguyễn Văn An', email: 'an@example.com',
      phoneNumber: '0901234567', password: 'Test@1234', confirmPassword: 'Test@1234' });
    component.captchaToken = 'captcha';
  }

  it('shows an inline phone error and prevents sending an invalid request', () => {
    validForm(); component.phoneNumber?.setValue('jfjewbjbfv');
    component.submit(); fixture.detectChanges();
    expect(auth.register).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Nhập số di động Việt Nam');
  });

  it('rejects names containing digits and malformed numeric-only email', () => {
    validForm(); component.fullName?.setValue('Nguyen123'); component.email?.setValue('123456');
    component.submit(); expect(auth.register).not.toHaveBeenCalled();
  });

  it('normalizes contact fields, accepts a numeric email local part and prevents duplicate submits', () => {
    validForm();
    component.registerForm.patchValue({ fullName: '  Nguyễn   Văn An ', email: ' 238420@GMAIL.COM ', phoneNumber: '+84 901 234 567' });
    component.submit(); component.submit();
    expect(auth.register).toHaveBeenCalledTimes(1);
    expect(auth.register.calls.mostRecent().args[0]).toEqual({
      fullName: 'Nguyễn Văn An', email: '238420@gmail.com', phoneNumber: '0901234567',
      password: 'Test@1234', confirmPassword: 'Test@1234', captchaToken: 'captcha',
    });
  });

  it('requires an exact confirmation and CAPTCHA', () => {
    validForm(); component.confirmPassword?.setValue('Test@1234 '); component.submit();
    expect(auth.register).not.toHaveBeenCalled();
    component.confirmPassword?.setValue('Test@1234'); component.captchaToken = ''; component.submit();
    expect(auth.register).not.toHaveBeenCalled(); expect(component.errorMessage).toContain('CAPTCHA');
  });

  it('shows a duplicate email error and requires a new CAPTCHA before retrying', () => {
    validForm(); component.submit();
    request.error({ error: { message: 'Email này đã được sử dụng.' } });
    expect(component.errorMessage).toBe('Email này đã được sử dụng.');
    expect(component.captchaToken).toBe(''); expect(component.isSubmitting).toBeFalse();
  });
});
