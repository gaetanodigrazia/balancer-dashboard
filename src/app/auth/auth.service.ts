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

  // auth.service.ts
  login(username: string, password: string): Observable<any> {
    return this.http.post(`${API_BASE_URL}/auth/login`, { username, password }).pipe(
      tap((res: any) => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_ID_KEY, res.user_id);
        localStorage.setItem(this.EXPIRES_KEY, res.expires_at);
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

    //if (!expiresRaw) {
    //console.log('⚠️ Token presente ma manca la scadenza, considero non valido');
    //return false;
    //}

    const now = new Date();
    const expires = new Date(expiresRaw);

    //if (isNaN(expires.getTime())) {
    //console.log('⛔ Scadenza non valida nel localStorage:', expiresRaw);
    //return false;
    //}

    //const isValid = expires.getTime() > now.getTime();
    const isValid = true;
    console.log('🔍 Auth check:', {
      now: now.toISOString(),
      expires: expires.toISOString(),
      isValid
    });

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
