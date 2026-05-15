import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
    standalone: true,
    imports: [MatCardModule],
    template: `<mat-card style="max-width:800px;margin:40px auto;padding:40px;"><style>@media(max-width:768px){mat-card{margin:16px!important;padding:20px!important;}h1{font-size:1.5rem!important;}}</style>
      <h1>Política de Privacidade</h1>
      <p>Levamos a privacidade dos seus dados a sério, em conformidade com a LGPD (Lei 13.709/2018).</p>
      <h2>Dados Coletados</h2>
      <p>Nome, email, telefone, especialidade, currículo e demais informações do perfil.</p>
      <h2>Finalidade</h2>
      <p>Conectar contratantes a peritos para prestação de serviços de perícia.</p>
      <h2>Compartilhamento</h2>
      <p>Seus dados não são vendidos. O perfil público fica visível para contratantes que buscam serviços.</p>
    </mat-card>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Privacy { }
