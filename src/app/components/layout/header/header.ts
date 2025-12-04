import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, RouterLink, CommonModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  authService = inject(AuthService);

  get dashboardLink(): string {
    const role = this.authService.userProfile()?.role;
    if (role === 'expert') {
      return '/expert-dashboard';
    }
    return '/client-dashboard';
  }

  onLogout() {
    this.authService.logout();
  }
}