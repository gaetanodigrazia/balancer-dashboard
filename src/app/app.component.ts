import { Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './auth/auth.service';

// IMPORT COOKIE CONSENT
import {
  NgcCookieConsentService,
  NgcStatusChangeEvent,
  NgcNoCookieLawEvent,
  NgcInitializingEvent,
  NgcInitializationErrorEvent
} from 'ngx-cookieconsent';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  isMobileView = false;
  sidebarOpen = false;

  // 🔁 CookieConsent Subscriptions
  popupOpenSubscription!: Subscription;
  popupCloseSubscription!: Subscription;
  initializingSubscription!: Subscription;
  initializedSubscription!: Subscription;
  initializationErrorSubscription!: Subscription;
  statusChangeSubscription!: Subscription;
  revokeChoiceSubscription!: Subscription;
  noCookieLawSubscription!: Subscription;

  constructor(
    public authService: AuthService,
    private router: Router,
    private ccService: NgcCookieConsentService
  ) {}

  ngOnInit(): void {
    this.checkViewport();

    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects || event.url;
        const isAuth = this.authService.isAuthenticated();
        console.log("🔄 NavigationEnd →", url, "isAuthenticated:", isAuth);

        if (!isAuth && url !== '/login') {
          console.log("⛔ Blocco accesso, redirect forzato");
          this.router.navigate(['/login'], { replaceUrl: true });
        }
      }
    });

    // 🔁 Subscriptions CookieConsent
    this.popupOpenSubscription = this.ccService.popupOpen$.subscribe(() => {
      console.log('[CookieConsent] popup aperto');
    });

    this.popupCloseSubscription = this.ccService.popupClose$.subscribe(() => {
      console.log('[CookieConsent] popup chiuso');
    });

    this.initializingSubscription = this.ccService.initializing$.subscribe((event: NgcInitializingEvent) => {
      console.log(`[CookieConsent] inizializzazione...`, event);
    });

    this.initializedSubscription = this.ccService.initialized$.subscribe(() => {
      console.log('[CookieConsent] inizializzato');
    });

    this.initializationErrorSubscription = this.ccService.initializationError$.subscribe(
      (event: NgcInitializationErrorEvent) => {
        console.error(`[CookieConsent] errore inizializzazione:`, event?.error?.message);
      });

    this.statusChangeSubscription = this.ccService.statusChange$.subscribe((event: NgcStatusChangeEvent) => {
      console.log(`[CookieConsent] status change: ${event.status}`);
    });

    this.revokeChoiceSubscription = this.ccService.revokeChoice$.subscribe(() => {
      console.log('[CookieConsent] scelta revocata');
    });

    this.noCookieLawSubscription = this.ccService.noCookieLaw$.subscribe((event: NgcNoCookieLawEvent) => {
      console.log('[CookieConsent] no cookie law: ', event);
    });
  }

  @HostListener('window:resize')
  checkViewport() {
    this.isMobileView = window.innerWidth < 768;
    if (!this.isMobileView) {
      this.sidebarOpen = true;
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  logout() {
    console.log('📌 logout() chiamato');
    this.authService.logout();
  }

  hideLayout(): boolean {
    return this.router.url === '/login';
  }

  ngOnDestroy(): void {
    this.popupOpenSubscription?.unsubscribe();
    this.popupCloseSubscription?.unsubscribe();
    this.initializingSubscription?.unsubscribe();
    this.initializedSubscription?.unsubscribe();
    this.initializationErrorSubscription?.unsubscribe();
    this.statusChangeSubscription?.unsubscribe();
    this.revokeChoiceSubscription?.unsubscribe();
    this.noCookieLawSubscription?.unsubscribe();
  }
}
