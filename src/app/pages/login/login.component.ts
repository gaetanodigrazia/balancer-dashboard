import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { API_BASE_URL } from '../../api.config';

import {
  NgcCookieConsentService,
  NgcInitializingEvent,
  NgcInitializationErrorEvent,
  NgcStatusChangeEvent,
  NgcNoCookieLawEvent
} from 'ngx-cookieconsent';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  activeTab: 'login' | 'demo' = 'login';
  username = '';
  password = '';
  generatedCredentials: { username: string; password: string } | null = null;
  showModal = false;

  // Cookie Consent Subscriptions
  popupOpenSubscription!: Subscription;
  popupCloseSubscription!: Subscription;
  initializingSubscription!: Subscription;
  initializedSubscription!: Subscription;
  initializationErrorSubscription!: Subscription;
  statusChangeSubscription!: Subscription;
  revokeChoiceSubscription!: Subscription;
  noCookieLawSubscription!: Subscription;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient,
    private ccService: NgcCookieConsentService
  ) {}

  ngOnInit(): void {
    this.popupOpenSubscription = this.ccService.popupOpen$.subscribe(() => {
      console.log('Cookie popup aperta');
    });

    this.popupCloseSubscription = this.ccService.popupClose$.subscribe(() => {
      console.log('Cookie popup chiusa');
    });

    this.initializingSubscription = this.ccService.initializing$.subscribe((event: NgcInitializingEvent) => {
      console.log('CookieConsent initializing:', event);
    });

    this.initializedSubscription = this.ccService.initialized$.subscribe(() => {
      console.log('CookieConsent initialized');
    });

    this.initializationErrorSubscription = this.ccService.initializationError$.subscribe(
      (event: NgcInitializationErrorEvent) => {
        console.error('CookieConsent init error:', event.error?.message);
      }
    );

    this.statusChangeSubscription = this.ccService.statusChange$.subscribe((event: NgcStatusChangeEvent) => {
      console.log('CookieConsent status change:', event.status);
    });

    this.revokeChoiceSubscription = this.ccService.revokeChoice$.subscribe(() => {
      console.log('Cookie choice revocata');
    });

    this.noCookieLawSubscription = this.ccService.noCookieLaw$.subscribe((event: NgcNoCookieLawEvent) => {
      console.log('Nessuna legge cookie applicabile:', event);
    });
  }

  ngOnDestroy(): void {
    this.popupOpenSubscription.unsubscribe();
    this.popupCloseSubscription.unsubscribe();
    this.initializingSubscription.unsubscribe();
    this.initializedSubscription.unsubscribe();
    this.initializationErrorSubscription.unsubscribe();
    this.statusChangeSubscription.unsubscribe();
    this.revokeChoiceSubscription.unsubscribe();
    this.noCookieLawSubscription.unsubscribe();
  }

  login(event?: Event): void {
    if (event) event.preventDefault();

    this.auth.login(this.username, this.password).subscribe({
      next: () => {
        console.log('✅ Navigo verso home');
        this.router.navigate(['/']);
      },
      error: () => {
        alert('Credenziali errate');
      }
    });
  }

  registerDemo(): void {
    this.auth.registerDemo().subscribe({
      next: (res) => {
        this.generatedCredentials = {
          username: res.username,
          password: res.password
        };
        this.showModal = true;
      },
      error: () => {
        alert('Errore nella generazione dell’utente demo');
      }
    });
  }

  closeModal(): void {
    this.showModal = false;
  }
}
