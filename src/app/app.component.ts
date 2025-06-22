import { Component, HostListener, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  isMobileView = false;
  sidebarOpen = false;

  constructor(public authService: AuthService, private router: Router) {}

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
  this.authService.logout(); // anche se non svuota, vogliamo solo confermare l'esecuzione
}


  hideLayout(): boolean {
    return this.router.url === '/login';
  }
}
