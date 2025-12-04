import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-expert-dashboard',
    standalone: true,
    imports: [MatCardModule, MatButtonModule, RouterLink],
    template: `
    <div class="dashboard-container">
      <h1>Área do Perito</h1>
      <div class="actions">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Meu Perfil</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Mantenha seus dados atualizados para atrair mais clientes.</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/expert/edit">Editar Perfil</button>
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
export class ExpertDashboard { }
