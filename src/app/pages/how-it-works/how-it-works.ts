import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatStepperModule } from '@angular/material/stepper';

@Component({
    selector: 'app-how-it-works',
    standalone: true,
    imports: [CommonModule, RouterModule, MatCardModule, MatButtonModule, MatIconModule, MatStepperModule],
    template: `
    <div class="page">
      <div class="hero">
        <h1>Como Funciona</h1>
        <p>Entenda como a plataforma conecta você ao perito ideal</p>
      </div>

      <section class="flow-section">
        <h2>Para Contratantes</h2>
        <div class="steps">
          <div class="step">
            <div class="step-icon"><mat-icon>search</mat-icon></div>
            <h3>1. Busque</h3>
            <p>Encontre peritos especializados na sua área de necessidade. Filtre por especialidade, localização e avaliações.</p>
          </div>
          <div class="step-arrow"><mat-icon>arrow_forward</mat-icon></div>
          <div class="step">
            <div class="step-icon"><mat-icon>description</mat-icon></div>
            <h3>2. Solicite</h3>
            <p>Envie uma solicitação de cotação detalhando seu caso. O perito analisará e responderá com uma proposta.</p>
          </div>
          <div class="step-arrow"><mat-icon>arrow_forward</mat-icon></div>
          <div class="step">
            <div class="step-icon"><mat-icon>handshake</mat-icon></div>
            <h3>3. Combine</h3>
            <p>Analise a proposta de valor e prazo. Aceite e comece a trabalhar com o perito escolhido.</p>
          </div>
          <div class="step-arrow"><mat-icon>arrow_forward</mat-icon></div>
          <div class="step">
            <div class="step-icon"><mat-icon>star</mat-icon></div>
            <h3>4. Avalie</h3>
            <p>Após a conclusão, deixe sua avaliação para ajudar outros contratantes e valorizar o perito.</p>
          </div>
        </div>
      </section>

      <section class="flow-section expert-flow">
        <h2>Para Peritos</h2>
        <div class="steps">
          <div class="step">
            <div class="step-icon"><mat-icon>person_add</mat-icon></div>
            <h3>1. Cadastre-se</h3>
            <p>Crie sua conta de perito, complete seu perfil com especialidades, certificações e portfólio.</p>
          </div>
          <div class="step-arrow"><mat-icon>arrow_forward</mat-icon></div>
          <div class="step">
            <div class="step-icon"><mat-icon>calendar_today</mat-icon></div>
            <h3>2. Disponibilidade</h3>
            <p>Defina seus horários disponíveis e os serviços que oferece com preços personalizados.</p>
          </div>
          <div class="step-arrow"><mat-icon>arrow_forward</mat-icon></div>
          <div class="step">
            <div class="step-icon"><mat-icon>quiz</mat-icon></div>
            <h3>3. Responda</h3>
            <p>Receba solicitações de cotação, analise os casos e envie suas propostas de valor.</p>
          </div>
          <div class="step-arrow"><mat-icon>arrow_forward</mat-icon></div>
          <div class="step">
            <div class="step-icon"><mat-icon>trending_up</mat-icon></div>
            <h3>4. Cresça</h3>
            <p>Acumule avaliações positivas, conquiste o selo de verificado e seja destacado na plataforma.</p>
          </div>
        </div>
      </section>

      <section class="cta-section">
        <mat-card class="cta-card">
          <mat-card-content>
            <h2>Pronto para começar?</h2>
            <p>Cadastre-se gratuitamente e encontre o perito ideal para seu caso.</p>
            <div class="cta-actions">
              <a mat-flat-button color="primary" routerLink="/register">Sou Contratante</a>
              <a mat-stroked-button routerLink="/register-expert">Sou Perito</a>
            </div>
          </mat-card-content>
        </mat-card>
      </section>
    </div>
  `,
    styles: [`
    .page { max-width:960px; margin:0 auto; padding:32px 24px; }
    .hero { text-align:center; margin-bottom:48px; }
    .hero h1 { font-size:2rem; color:#1a237e; margin-bottom:8px; }
    .hero p { color:#666; font-size:1.1rem; }
    .flow-section { margin-bottom:48px; }
    .flow-section h2 { font-size:1.5rem; color:#1a237e; margin-bottom:24px; text-align:center; }
    .steps { display:flex; align-items:center; justify-content:center; gap:16px; flex-wrap:wrap; }
    .step { flex:1; min-width:180px; max-width:220px; text-align:center; }
    .step-icon { width:64px; height:64px; border-radius:50%; background:#e8eaf6; display:flex; align-items:center; justify-content:center; margin:0 auto 12px; }
    .step-icon mat-icon { font-size:28px; width:28px; height:28px; color:#1a237e; }
    .step h3 { font-size:1.1rem; color:#333; margin-bottom:8px; }
    .step p { font-size:.9rem; color:#666; line-height:1.5; }
    .step-arrow { color:#bbb; }
    .step-arrow mat-icon { font-size:32px; width:32px; height:32px; }
    .expert-flow .step-icon { background:#fff3e0; }
    .expert-flow .step-icon mat-icon { color:#e65100; }
    .cta-section { margin-top:32px; }
    .cta-card { text-align:center; padding:32px; background:#1a237e; color:white; border-radius:16px; }
    .cta-card h2 { color:white; font-size:1.5rem; margin-bottom:8px; }
    .cta-card p { color:rgba(255,255,255,.8); margin-bottom:24px; }
    .cta-actions { display:flex; gap:12px; justify-content:center; flex-wrap:wrap; }
    @media (max-width:768px) { .steps { flex-direction:column; } .step-arrow { transform:rotate(90deg); } }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorks { }
