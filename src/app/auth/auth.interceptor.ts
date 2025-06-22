import { Injectable } from '@angular/core';
import {
  HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('auth_token');

    // ✅ Usa "keysession" come header, come richiesto dal backend FastAPI
    const authReq = token
      ? req.clone({
          setHeaders: { keysession: token }
        })
      : req;

    // 🔍 Log utile per debug
    console.log('%c➡️ Request:', 'color: blue', {
      url: authReq.url,
      method: authReq.method,
      body: authReq.body,
      headers: authReq.headers,
    });

    return next.handle(authReq).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            console.log('%c✅ Response:', 'color: green', {
              url: req.url,
              status: event.status,
              body: event.body,
            });
          }
        },
        error: (error: HttpErrorResponse) => {
          console.error('%c❌ Error Response:', 'color: red', {
            url: req.url,
            status: error.status,
            error: error.error,
          });
        }
      })
    );
  }
}
