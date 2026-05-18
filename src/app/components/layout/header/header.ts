import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { NotificationService } from '../../../services/notification.service';
import { TimeAgoPipe } from '../../../pipes/time-ago.pipe';
import type { AppNotification } from '../../../services/notification.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, MatDividerModule, RouterLink, RouterLinkActive, TimeAgoPipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  notifSvc = inject(NotificationService);

  mobileMenuOpen = false;

  get user() { return this.auth.userProfile(); }
  get isAuthenticated() { return this.auth.authenticated(); }

  get displayName(): string {
    const p = this.user;
    if (!p) return '';
    return p.first_name || p.contact_email?.split('@')[0] || 'Usuário';
  }

  ngOnInit() {
    this.notifSvc.loadNotifications();
    this.notifSvc.subscribe();
  }

  get isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }

  get isExpert(): boolean {
    return this.user?.role === 'PERITO';
  }

  get isClient(): boolean {
    return this.user?.role === 'CONTRATANTE';
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    this.mobileMenuOpen = false;
  }

  async logout() {
    this.closeMobileMenu();
    const confirmed = window.confirm('Tem certeza que deseja sair?');
    if (!confirmed) return;
    await this.auth.logout();
  }

  async openNotification(n: AppNotification) {
    if (!n.read) {
      await this.notifSvc.markAsRead(n.id);
    }
    switch (n.type) {
      case 'new_quote':
      case 'quote_response':
      case 'new_message':
      case 'appointment_scheduled':
      case 'appointment_cancelled':
      case 'appointment_confirmed':
      case 'appointment_completed':
        if (this.isExpert) this.router.navigate(['/expert-dashboard']);
        else this.router.navigate(['/client-dashboard']);
        break;
      case 'expert_approved':
        this.router.navigate(['/expert-dashboard']);
        break;
    }
  }
}
