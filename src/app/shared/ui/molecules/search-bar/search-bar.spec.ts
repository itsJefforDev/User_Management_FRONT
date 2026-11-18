import { TestBed } from '@angular/core/testing';
import { SearchBarComponent } from './search-bar';

describe('SearchBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchBarComponent],
    }).compileComponents();
  });

  it('should create the search bar', () => {
    const fixture = TestBed.createComponent(SearchBarComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should emit search output on input change', () => {
    const fixture = TestBed.createComponent(SearchBarComponent);
    let emitted = '';
    fixture.componentInstance.search.subscribe((val) => (emitted = val));

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'Carlos';
    input.dispatchEvent(new Event('input'));

    expect(emitted).toBe('Carlos');
  });
});
