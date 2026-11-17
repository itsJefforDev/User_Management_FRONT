import { TestBed } from '@angular/core/testing';
import { BadgeComponent } from './badge';

describe('BadgeComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();
  });

  it('should create the badge', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should apply success styling when variant is success', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    fixture.componentRef.setInput('variant', 'success');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.className).toContain('text-emerald-700');
  });

  it('should apply danger styling when variant is danger', () => {
    const fixture = TestBed.createComponent(BadgeComponent);
    fixture.componentRef.setInput('variant', 'danger');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.className).toContain('text-rose-700');
  });
});
