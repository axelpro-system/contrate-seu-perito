import { Component, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

interface FaqItem {
    question: string;
    answer: string;
}

@Component({
    selector: 'app-support',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatCardModule,
        MatExpansionModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
    ],
    template: `
    <div class="support-page">
      <div class="hero">
        <h1>Central de Ajuda</h1>
        <p>Como podemos ajudar você?</p>
        <div class="search-box">
          <mat-icon>search</mat-icon>
          <input type="text" placeholder="Buscar na central de ajuda..." [(ngModel)]="searchTerm" (input)="filterFaqs()">
        </div>
      </div>

      <div class="content">
        <section class="faq-section">
          <h2>Perguntas Frequentes</h2>
          <mat-accordion>
            @for (faq of filteredFaqs; track faq.question) {
              <mat-expansion-panel>
                <mat-expansion-panel-header>
                  <mat-panel-title>{{ faq.question }}</mat-panel-title>
                </mat-expansion-panel-header>
                <p>{{ faq.answer }}</p>
              </mat-expansion-panel>
            }
          </mat-accordion>
        </section>

        <section class="contact-section">
          <h2>Fale Conosco</h2>
          <mat-card>
            <mat-card-content>
              <form [formGroup]="contactForm" (ngSubmit)="onSubmit()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nome</mat-label>
                  <input matInput formControlName="name" placeholder="Seu nome">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email" placeholder="seu@email.com">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Assunto</mat-label>
                  <input matInput formControlName="subject" placeholder="Assunto da mensagem">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Mensagem</mat-label>
                  <textarea matInput formControlName="message" rows="5" placeholder="Descreva sua dúvida ou problema..."></textarea>
                </mat-form-field>
                <button mat-flat-button color="primary" type="submit" [disabled]="contactForm.invalid || loading">
                  @if (loading) { <mat-spinner diameter="20"></mat-spinner> } @else { Enviar Mensagem }
                </button>
              </form>
            </mat-card-content>
          </mat-card>
        </section>
      </div>
    </div>
  `,
    styles: [`
    .support-page { max-width:900px; margin:0 auto; padding:32px 24px; }
    .hero { text-align:center; margin-bottom:40px; }
    .hero h1 { font-size:2rem; color:#1a237e; margin-bottom:8px; }
    .hero p { color:#666; margin-bottom:24px; }
    .search-box { display:flex; align-items:center; gap:12px; max-width:500px; margin:0 auto; background:white; border:1px solid #e0e0e0; border-radius:8px; padding:8px 16px; }
    .search-box input { border:none; outline:none; flex:1; font-size:1rem; }
    .search-box mat-icon { color:#666; }
    .content { display:flex; flex-direction:column; gap:40px; }
    .faq-section h2, .contact-section h2 { font-size:1.5rem; color:#1a237e; margin-bottom:16px; }
    .full-width { width:100%; }
    mat-card-content { padding:24px; }
    button { margin-top:16px; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportPage {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);
    searchTerm = '';
    loading = false;

    contactForm = this.fb.group({
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        subject: ['', Validators.required],
        message: ['', [Validators.required, Validators.minLength(10)]],
    });

    faqs: FaqItem[] = [
        { question: 'Como solicito uma cotação?', answer: 'Busque um perito na página de busca e clique em "Solicitar Cotação". Preencha os detalhes do seu caso e envie.' },
        { question: 'Como me cadastro como perito?', answer: 'Clique em "Sou Perito" na página de cadastro. Após criar sua conta, complete seu perfil com suas especialidades e certificações.' },
        { question: 'Como funciona o pagamento?', answer: 'O pagamento é combinado diretamente entre você e o perito. A plataforma facilita a comunicação e proposta de valores.' },
        { question: 'Posso avaliar um perito?', answer: 'Sim! Após a conclusão do serviço, você pode deixar uma avaliação com nota de 1 a 5 e um comentário.' },
        { question: 'Como altero meu perfil?', answer: 'Acesse o dashboard e clique em "Editar Perfil". Lá você pode atualizar suas informações, foto e certificações.' },
        { question: 'É seguro usar a plataforma?', answer: 'Sim. Utilizamos criptografia de ponta a ponta e todos os dados são protegidos conforme a LGPD.' },
    ];

    filteredFaqs: FaqItem[] = [...this.faqs];

    filterFaqs() {
        const term = this.searchTerm.toLowerCase();
        this.filteredFaqs = this.faqs.filter(f =>
            f.question.toLowerCase().includes(term) || f.answer.toLowerCase().includes(term)
        );
    }

    async onSubmit() {
        if (this.contactForm.invalid || this.loading) return;
        this.loading = true;
        try {
            await this.supabase.submitContact({
                name: this.contactForm.value.name!,
                email: this.contactForm.value.email!,
                subject: this.contactForm.value.subject!,
                message: this.contactForm.value.message!,
            });
            this.notify.success('Mensagem enviada com sucesso!');
            this.contactForm.reset();
        } catch {
            this.notify.error('Erro ao enviar mensagem.');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }
}
