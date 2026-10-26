import { FormControl } from '@angular/forms';
import { accountEmailValidator, normalizeFullName, normalizePhone, personNameValidator,
  strongPasswordValidator, vietnameseMobileValidator } from './account-validation.util';

describe('Account validation rules', () => {
  ["Nguyễn Văn An", 'An', "O\'Connor", 'Anne-Marie', 'D’Arcy', '李明', '𐐀𐐁'].forEach(name => {
    it(`accepts a real-world name: ${name}`, () => expect(personNameValidator(new FormControl(name))).toBeNull());
  });
  ['', '   ', 'A', 'Nguyen123', '123456', '<script>', 'Nguyễn🙂', 'Nguyễn\nAn', 'Nguyễn\tAn', 'Nguyễn\u200bAn', 'Nguyen-', '-Nguyen', "O''Connor"].forEach(name => {
    it(`rejects an invalid name: ${JSON.stringify(name)}`, () => expect(personNameValidator(new FormControl(name))).not.toBeNull());
  });
  it('normalizes Vietnamese combining accents and repeated spaces', () => {
    expect(normalizeFullName('  Nguye\u0302\u0303n   Va\u0306n An  ')).toBe('Nguyễn Văn An');
  });
  it('checks the normalized name length boundary', () => {
    expect(personNameValidator(new FormControl('A'.repeat(150)))).toBeNull();
    expect(personNameValidator(new FormControl('A'.repeat(151)))).not.toBeNull();
  });
  ['', null, '0901234567', '0312345678', '0512345678', '0712345678', '0812345678', '+84901234567', ' +84 901 234 567 ', '090.123.4567', '090-123-4567'].forEach(phone => {
    it(`accepts an optional or valid phone: ${phone}`, () => expect(vietnameseMobileValidator(new FormControl(phone))).toBeNull());
  });
  ['abc', '1', '090123456', '09012345678', '0212345678', '0000000000', '-0901234567', '0901234567-', '+840901234567', '84901234567', '０９０１２３４５６７', '0901234567\n', '\t', '090\u200b1234567'].forEach(phone => {
    it(`rejects an invalid phone: ${JSON.stringify(phone)}`, () => expect(vietnameseMobileValidator(new FormControl(phone))).not.toBeNull());
  });
  it('normalizes international and formatted phone numbers', () => {
    expect(normalizePhone('+84 901 234 567')).toBe('0901234567');
    expect(normalizePhone('090.123.4567')).toBe('0901234567');
  });
  ['238420@gmail.com', 'an+shop@example.com', ' AN@EXAMPLE.COM ', "an.o'connor@example.com"].forEach(email => {
    it(`accepts a valid email: ${email}`, () => expect(accountEmailValidator(new FormControl(email))).toBeNull());
  });
  ['12345', 'an@gmail', 'an@@gmail.com', '.an@example.com', 'an.@example.com', 'an..test@example.com', 'an@-example.com', 'an@example-.com', 'an@example..com', 'an test@example.com', 'an@example.com\n'].forEach(email => {
    it(`rejects an invalid email: ${JSON.stringify(email)}`, () => expect(accountEmailValidator(new FormControl(email))).not.toBeNull());
  });
  it('checks email local part, domain label and total length boundaries', () => {
    expect(accountEmailValidator(new FormControl('a'.repeat(64) + '@example.com'))).toBeNull();
    expect(accountEmailValidator(new FormControl('a'.repeat(65) + '@example.com'))).not.toBeNull();
    expect(accountEmailValidator(new FormControl('an@' + 'a'.repeat(64) + '.com'))).not.toBeNull();
    const email = 'a'.repeat(64) + '@' + 'b'.repeat(63) + '.' + 'c'.repeat(63) + '.' + 'd'.repeat(61);
    expect(email.length).toBe(254);
    expect(accountEmailValidator(new FormControl(email))).toBeNull();
    expect(accountEmailValidator(new FormControl(email + 'a'))).not.toBeNull();
  });
  ['Test@1234', 'Abc@1234', 'Ab1@    '].forEach(password => {
    it('accepts the configured password policy without trimming spaces', () => expect(strongPasswordValidator(new FormControl(password))).toBeNull());
  });
  ['test@1234', 'Test1234', 'Test@@@@', 'A1@abcd', 'Abc1234\u0301', 'Test@1234\n', 'Test@1234\0', 'Test@1234\u200b'].forEach(password => {
    it('rejects a weak password or hidden characters', () => expect(strongPasswordValidator(new FormControl(password))).not.toBeNull());
  });
  it('checks actual UTF-8 bytes without truncating a password', () => {
    expect(strongPasswordValidator(new FormControl('A1@' + 'a'.repeat(69)))).toBeNull();
    expect(strongPasswordValidator(new FormControl('A1@' + 'a'.repeat(70)))?.maxBytes).toBeTrue();
    expect(strongPasswordValidator(new FormControl('A1@' + 'é'.repeat(34) + 'x'))).toBeNull();
    expect(strongPasswordValidator(new FormControl('A1@' + 'é'.repeat(35)))?.maxBytes).toBeTrue();
  });
});
