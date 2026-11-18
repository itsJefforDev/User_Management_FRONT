import { TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field';

describe('FormFieldComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent],
    }).compileComponents();
  });

  it('should create the form field', () => {
    const fixture = TestBed.createComponent(FormFieldComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should display label and asterisk when required', () => {
    const fixture = TestBed.createComponent(FormFieldComponent);
    fixture.componentRef.setInput('label', 'Correo');
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    const label = fixture.nativeElement.querySelector('label');
    expect(label.textContent).toContain('Correo');
    expect(label.querySelector('span')?.textContent).toContain('*');
  });

  it('should render error message when provided', () => {
    const fixture = TestBed.createComponent(FormFieldComponent);
    fixture.componentRef.setInput('errorMessage', 'Campo requerido');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('p');
    expect(error.textContent).toContain('Campo requerido');
  });
});
