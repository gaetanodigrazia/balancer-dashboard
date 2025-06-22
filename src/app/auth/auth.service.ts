import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api.config';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_ID_KEY = 'user_id';
  private readonly EXPIRES_KEY = 'expires_at';

  constructor(private http: HttpClient) {}

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

  logout(): Observable<any> {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return this.http.post(`${API_BASE_URL}/auth/logout`, { token }).pipe(
      tap(() => {
        this.clearSession();
        console.log('🔒 Logout effettuato');
      })
    );
  }

  clearSession() {
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
    const expires = localStorage.getItem(this.EXPIRES_KEY);
    return !!token && !!expires && new Date(expires) > new Date();
  }
}
