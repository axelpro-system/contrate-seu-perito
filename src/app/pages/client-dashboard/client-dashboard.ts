import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-client-dashboard',
    standalone: true,
    imports: [MatCardModule, MatButtonModule, RouterLink],
    template: `
    <div class="dashboard-container">
      <h1>Área do Cliente</h1>
      <div class="actions">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Encontrar Peritos</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Busque pelos melhores especialistas para o seu caso.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/search">Buscar Agora</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
    styles: [`
    .dashboard-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    .actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-top: 20px;
    }
  `]
})
export class ClientDashboard { }
