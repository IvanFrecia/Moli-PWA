import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth';
import { LayoutComponent } from './shared-ui/components/layout/layout';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  protected title = 'Moli PWA';
  
  currentUser = this.authService.currentUser;

  ngOnInit(): void {
    // Check if user needs to login
    if (!this.authService.isAuthenticated() && !this.isLoginRoute()) {
      this.router.navigate(['/login']);
    }
  }

  private isLoginRoute(): boolean {
    return this.router.url === '/login';
  }
}
