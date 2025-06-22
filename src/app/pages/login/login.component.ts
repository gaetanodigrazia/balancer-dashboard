import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service'; // 👈 importa il servizio
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) {}

login() {
  this.auth.login(this.username, this.password).subscribe({
    next: () => {
      this.router.navigate(['/']);
    },
    error: () => {
      alert('Credenziali errate');
    }
  });
}


}
