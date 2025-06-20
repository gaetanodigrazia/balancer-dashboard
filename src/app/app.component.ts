import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  formData: any = {};
  sidebarOpen: boolean = false;
  isMobileView: boolean = false;

  ngOnInit(): void {
    this.checkWindowSize();
    window.addEventListener('resize', this.checkWindowSize.bind(this));
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
}
