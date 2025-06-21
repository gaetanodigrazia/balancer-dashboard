import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  formData: any = {};
  sidebarOpen: boolean = false;
  isMobileView: boolean = false;

  constructor(public router: Router, private authService: AuthService) { }

ngOnInit(): void {
  this.checkWindowSize();
  window.addEventListener('resize', this.checkWindowSize.bind(this));

  // Forza redirect se non autenticato
  if (!this.authService.isAuthenticated() && this.router.url !== '/login') {
    this.router.navigate(['/login']);
  }
}


  updateData(partial: any): void {
    this.formData = { ...this.formData, ...partial };
  }

  checkWindowSize(): void {
    this.isMobileView = window.innerWidth < 768;
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
    document.body.classList.toggle('sidebar-open', this.sidebarOpen);
  }
  hideLayout(): boolean {
    // Aggiungi altre rotte se vuoi escludere anche registrazione, ecc.
    return this.router.url === '/login';
  }
  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
