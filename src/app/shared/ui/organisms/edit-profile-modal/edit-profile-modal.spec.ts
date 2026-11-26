import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { EditProfileModalComponent } from './edit-profile-modal';
import { AuthService } from '../../../../core/services/auth.service';

describe('EditProfileModalComponent', () => {
  let authService: AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditProfileModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    authService = TestBed.inject(AuthService);
    authService.currentUser.set({ token: 't', email: 'user@empresa.com', name: 'Usuario', role: [] });
  });

  const create = () => TestBed.createComponent(EditProfileModalComponent).componentInstance;

  it('should validate the new password and its confirmation', () => {
    const c = create();
    c.changePassword.set(true);
    c.currentPassword.set('Actual123');
    c.newPassword.set('abc');
    c.confirmPassword.set('xyz');
    expect(c.validate()).toBe(false);
    expect(c.errors()['newPassword']).toContain('Mínimo 8');
    expect(c.errors()['confirmPassword']).toContain('no coinciden');
  });

  it('should save directly when the email did not change', () => {
    const c = create();
    const spy = vi.spyOn(authService, 'updateProfile').mockReturnValue(of({}));
    c.name.set('Nuevo Nombre');
    c.submit();
    expect(spy).toHaveBeenCalledWith({ name: 'Nuevo Nombre' });
  });

  it('should ask for the verification code before saving when the email changed', () => {
    const c = create();
    const codeSpy = vi.spyOn(authService, 'requestEmailChangeCode').mockReturnValue(of({ message: 'ok' }));
    const saveSpy = vi.spyOn(authService, 'updateProfile').mockReturnValue(of({}));

    c.email.set('nuevo@empresa.com');
    c.submit();

    expect(codeSpy).toHaveBeenCalledWith('nuevo@empresa.com');
    expect(c.step()).toBe('verify');
    expect(saveSpy).not.toHaveBeenCalled();

    c.code.set('1234');
    c.save();
    expect(saveSpy).toHaveBeenCalledWith({ name: 'Usuario', email: 'nuevo@empresa.com', emailCode: '1234' });
  });
});
