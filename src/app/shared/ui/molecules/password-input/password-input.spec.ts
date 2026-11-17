import { TestBed } from '@angular/core/testing';
import { PasswordInputComponent } from './password-input';

describe('PasswordInputComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordInputComponent],
    }).compileComponents();
  });

  it('should create the password input', () => {
    const fixture = TestBed.createComponent(PasswordInputComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should toggle password visibility when eye button is clicked', () => {
    const fixture = TestBed.createComponent(PasswordInputComponent);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    expect(input.type).toBe('password');

    button.click();
    fixture.detectChanges();
    expect(input.type).toBe('text');

    button.click();
    fixture.detectChanges();
    expect(input.type).toBe('password');
  });
});
