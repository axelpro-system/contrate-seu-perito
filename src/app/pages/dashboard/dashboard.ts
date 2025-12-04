import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatTabsModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    DatePipe
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  // Mock Data for Client View
  sentQuotes = [
    {
      id: 1,
      expertName: 'Dr. Carlos Silva',
      status: 'replied',
      date: new Date(),
      description: 'Perícia médica para processo trabalhista...'
    },
    {
      id: 2,
      expertName: 'Eng. Ana Souza',
      status: 'pending',
      date: new Date(Date.now() - 86400000), // Yesterday
      description: 'Avaliação estrutural de imóvel residencial...'
    }
  ];

  // Mock Data for Expert View
  receivedRequests = [
    {
      id: 3,
      clientName: 'João Pereira',
      status: 'pending',
      date: new Date(),
      description: 'Necessito de assistente técnico para perícia contábil...'
    }
  ];

  getStatusColor(status: string): string {
    switch (status) {
      case 'replied': return 'primary';
      case 'accepted': return 'accent';
      case 'rejected': return 'warn';
      default: return '';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'replied': return 'Respondido';
      case 'accepted': return 'Aceito';
      case 'rejected': return 'Recusado';
      default: return 'Pendente';
    }
  }
}
