import { CommonModule } from '@angular/common';
import { Component, HostListener } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.css']
})
export class LayoutComponent {
 sidebarOpen = false;
  isMobileView = window.innerWidth < 768;

  constructor(public authService: AuthService, private router: Router) {}

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobileView = window.innerWidth < 768;
    if (!this.isMobileView) this.sidebarOpen = false;
  }

  ngOnInit() {
    this.onResize();
  }

  logout() {
    this.authService.logout();
  }
}
