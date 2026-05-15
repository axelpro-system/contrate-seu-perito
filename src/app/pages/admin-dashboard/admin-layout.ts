import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../services/auth.service';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule, MatToolbarModule],
    template: `
    <mat-toolbar color="primary">
      <button mat-icon-button (click)="drawer.toggle()"><mat-icon>menu</mat-icon></button>
      <span style="flex:1;">Admin — Contrate seu Perito</span>
      <button mat-icon-button (click)="logout()"><mat-icon>exit_to_app</mat-icon></button>
    </mat-toolbar>
    <mat-sidenav-container style="height:calc(100vh - 64px);">
      <mat-sidenav #drawer mode="side" opened style="width:240px;padding:16px;">
        <mat-nav-list>
          <a mat-list-item routerLink="/admin" routerLinkActive="active-link" [routerLinkActiveOptions]="{exact:true}">
            <mat-icon matListItemIcon>dashboard</mat-icon> Dashboard
          </a>
          <a mat-list-item routerLink="/admin/users" routerLinkActive="active-link">
            <mat-icon matListItemIcon>people</mat-icon> Usuários
          </a>
          <a mat-list-item routerLink="/admin/specialties" routerLinkActive="active-link">
            <mat-icon matListItemIcon>category</mat-icon> Especialidades
          </a>
          <a mat-list-item routerLink="/admin/logs" routerLinkActive="active-link">
            <mat-icon matListItemIcon>history</mat-icon> Logs
          </a>
          <a mat-list-item routerLink="/admin/pending-experts" routerLinkActive="active-link">
            <mat-icon matListItemIcon>pending</mat-icon> Peritos Pendentes
          </a>
        </mat-nav-list>
      </mat-sidenav>
      <mat-sidenav-content style="padding:24px;background:#f4f5f8;min-height:100%;">
        <router-outlet></router-outlet>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
    styles: [`.active-link { background: #e8eaf6 !important; font-weight:600; }`],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminLayout {
    private auth = inject(AuthService);
    private router = inject(Router);
    logout() { this.auth.logout(); }
}
