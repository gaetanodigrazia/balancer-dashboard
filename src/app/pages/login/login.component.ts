import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../auth/auth.service'; // 👈 importa il servizio
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(private auth: AuthService, private router: Router) { }


  login(event?: Event) {
    if (event) event.preventDefault(); // previene il submit classico

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




}
