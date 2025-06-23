import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { API_BASE_URL } from '../../api.config';

@Component({
  selector: 'app-login',
  standalone: true,
imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  // tab attivo
  activeTab: 'login' | 'demo' = 'login';

  // login form
  username = '';
  password = '';

  // demo
  generatedCredentials: { username: string; password: string } | null = null;
  showModal = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private http: HttpClient
  ) {}

  // login classico
  login(event?: Event) {
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

registerDemo() {
  console.log('[registerDemo] Cliccato');

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


  // chiusura modal
  closeModal() {
    this.showModal = false;
  }
}
