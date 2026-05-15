import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
    standalone: true,
    imports: [MatCardModule],
    template: `<mat-card style="max-width:800px;margin:40px auto;padding:40px;"><style>@media(max-width:768px){mat-card{margin:16px!important;padding:20px!important;}h1{font-size:1.5rem!important;}}</style>
      <h1>Termos de Uso</h1>
      <p>Plataforma que conecta contratantes a peritos judiciais e técnicos.</p>
      <p>Ao utilizar nossos serviços, você concorda com os termos aqui descritos.</p>
      <h2>Uso da Plataforma</h2>
      <p>O contratante pode buscar, visualizar perfis e solicitar cotações. O perito pode gerenciar seu perfil e responder propostas.</p>
      <h2>Responsabilidades</h2>
      <p>A plataforma é um canal de conexão. A relação contratual é diretamente entre contratante e perito.</p>
    </mat-card>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Terms { }
