import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-email-confirmation',
    standalone: true,
    imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatIconModule],
    template: `
    <div class="confirmation-container">
      <mat-card class="confirmation-card">
        <mat-card-content>
          <div class="icon-wrapper">
            <mat-icon class="confirmation-icon">mark_email_read</mat-icon>
          </div>
          <h1>Verifique seu e-mail</h1>
          <p class="description">
            Enviamos um link de confirmação para o seu e-mail.
            Clique no link para ativar sua conta e completar seu perfil profissional.
          </p>
          <p class="hint">
            Não recebeu o e-mail? Verifique a pasta de spam ou tente novamente.
          </p>
          <div class="actions">
            <button mat-raised-button color="primary" routerLink="/login">
              Voltar ao login
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
    styles: [`
    .confirmation-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 24px;
      background: #f5f5f5;
    }
    .confirmation-card {
      max-width: 480px;
      width: 100%;
      text-align: center;
      padding: 32px;
    }
    .icon-wrapper {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #e8f5e9;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .confirmation-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #4caf50;
    }
    h1 {
      margin: 0 0 16px;
      font-size: 24px;
      color: #1a1a1a;
    }
    .description {
      margin: 0 0 16px;
      color: #666;
      line-height: 1.6;
    }
    .hint {
      margin: 0 0 24px;
      color: #999;
      font-size: 14px;
    }
    .actions {
      display: flex;
      justify-content: center;
    }
    @media (max-width: 480px) {
      .confirmation-card {
        padding: 24px;
      }
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailConfirmation {
}
