import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const authenticated = auth.isAuthenticated();
  console.log('🛡️ authGuard → isAuthenticated:', authenticated);

  if (!authenticated) {
    console.warn('⛔ Non autenticato → redirect /login');
    router.navigate(['/login']);
    return false;
  }

  console.log('✅ Utente autenticato → accesso consentito');
  return true;
};
