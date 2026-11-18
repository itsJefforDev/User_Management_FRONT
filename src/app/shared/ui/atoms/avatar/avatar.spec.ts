import { TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar';

describe('AvatarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent],
    }).compileComponents();
  });

  it('should create the avatar', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should compute initials from full name', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('name', 'Sofia Gomez');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('span');
    expect(span.textContent.trim()).toBe('SG');
  });

  it('should render image if src is provided', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('src', 'https://example.com/photo.jpg');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.getAttribute('src')).toBe('https://example.com/photo.jpg');
  });
});
