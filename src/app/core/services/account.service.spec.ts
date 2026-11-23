import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountService } from './account.service';

describe('AccountService', () => {
  let service: AccountService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AccountService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AccountService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate initial total balance and counts', () => {
    expect(service.totalAccounts()).toBeGreaterThan(0);
    expect(service.totalBalance()).toBeGreaterThan(0);
    expect(service.bankCount()).toBeGreaterThan(0);
  });

  it('should filter accounts by search query', () => {
    service.setSearchQuery('Nequi');
    const filtered = service.filteredAccounts();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toContain('Nequi');
  });
});
