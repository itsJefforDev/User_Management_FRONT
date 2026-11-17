import { TestBed } from '@angular/core/testing';
import { InputComponent } from './input';

describe('InputComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent],
    }).compileComponents();
  });

  it('should create the input', () => {
    const fixture = TestBed.createComponent(InputComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should update value on input event', () => {
    const fixture = TestBed.createComponent(InputComponent);
    fixture.detectChanges();
    const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');

    inputElement.value = 'John Doe';
    inputElement.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(fixture.componentInstance.value()).toBe('John Doe');
  });

  it('should reflect disabled state', () => {
    const fixture = TestBed.createComponent(InputComponent);
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const inputElement: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(inputElement.disabled).toBe(true);
  });
});
