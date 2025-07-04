import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_ID_KEY = 'user_id';
  private readonly EXPIRES_KEY = 'expires_at';
  constructor(private http: HttpClient, private router: Router) { }

  login(username: string, password: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/auth/login`, { username, password }).pipe(
      tap((res: any) => {
        console.log(res);
        localStorage.setItem(this.TOKEN_KEY, res.keySession);
        localStorage.setItem(this.USER_ID_KEY, res.id);

        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        localStorage.setItem(this.EXPIRES_KEY, expiresAt.toISOString());

        console.log('✅ Login OK:', res);
      })

    );
  }

  registerDemo(): Observable<{ username: string; password: string }> {
    return this.http.post<{ username: string; password: string }>(
      `${API_BASE_URL}/auth/demo-login`,
      {}
    );
  }





  logout(): void {
    console.log('🧼 AuthService.logout() chiamato');
    this.clearSession();
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  clearSession() {
    console.log('🧹 clearSession() → pulizia in corso');
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_ID_KEY);
    localStorage.removeItem(this.EXPIRES_KEY);
  }


  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getUserId(): string | null {
    return localStorage.getItem(this.USER_ID_KEY);
  }
  isAuthenticated(): boolean {
    const token = this.getToken();
    const expiresRaw = localStorage.getItem(this.EXPIRES_KEY);

    if (!token) {
      console.log('⛔ Nessun token presente');
      return false;
    }

    if (!expiresRaw) {
      console.log('⛔ Nessuna data di scadenza presente in localStorage');
      return false;
    }

    const safeExpiryRaw = expiresRaw.replace(' ', 'T');
    const expiryDate = new Date(safeExpiryRaw);

    if (isNaN(expiryDate.getTime())) {
      console.error('⛔ Data di scadenza non valida in localStorage:', expiresRaw);
      return false;
    }

    const now = new Date();
    const isValid = now < expiryDate;

    try {
      console.log(`✅ Token valido: ${isValid} | Ora: ${now.toISOString()} | Scadenza: ${expiryDate.toISOString()}`);
    } catch (err) {
      console.error('⚠️ Errore durante la stampa di debug delle date:', err);
    }

    return isValid;
  }

  getCurrentUser(): Observable<any> {
    const token = this.getToken();
    console.log('🔍 Chiamata getCurrentUser() in corso');

    return this.http.get<any>(`${API_BASE_URL}/utenti/utente`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}
