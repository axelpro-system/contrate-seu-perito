import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ExpertCard } from '../../components/expert-card/expert-card';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatFormFieldModule,
    MatIconModule,
    FormsModule,
    ExpertCard
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  searchTerm: string = '';
  selectedSpecialty: string = '';
  selectedLocation: string = '';

  specialties = ['Engenharia Civil', 'Medicina', 'Contabilidade', 'Grafotécnica', 'Ambiental'];
  locations = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Brasília, DF'];

  featuredExperts = [
    {
      id: '1',
      name: 'Dr. Carlos Silva',
      title: 'Perito Médico Federal',
      location: 'São Paulo, SP',
      specialties: ['Medicina do Trabalho', 'Ortopedia'],
      rating: 4.8,
      reviewsCount: 124,
      hourlyRate: 'R$ 450'
    },
    {
      id: '2',
      name: 'Eng. Ana Souza',
      title: 'Engenheira Civil',
      location: 'Rio de Janeiro, RJ',
      specialties: ['Avaliação de Imóveis', 'Patologia'],
      rating: 4.9,
      reviewsCount: 89,
      hourlyRate: 'R$ 380'
    },
    {
      id: '3',
      name: 'Roberto Santos',
      title: 'Perito Contábil',
      location: 'Belo Horizonte, MG',
      specialties: ['Cálculos Trabalhistas', 'Financeiro'],
      rating: 4.7,
      reviewsCount: 56,
      hourlyRate: 'R$ 300'
    }
  ];

  constructor(private router: Router) { }

  onSearch() {
    this.router.navigate(['/search'], {
      queryParams: {
        term: this.searchTerm,
        specialty: this.selectedSpecialty,
        location: this.selectedLocation
      }
    });
  }
}
