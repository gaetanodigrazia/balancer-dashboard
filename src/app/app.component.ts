import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent {
  formData: any = {};

  updateData(partial: any) {
    this.formData = { ...this.formData, ...partial };
  }
}
