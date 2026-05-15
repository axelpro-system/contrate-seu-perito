import { Component, OnInit, ChangeDetectorRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';

@Component({
    selector: 'app-expert-onboarding',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatStepperModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatProgressSpinnerModule,
        MatChipsModule,
        MatSelectModule,
    ],
    template: `
    <div class="onboarding-page">
      <div class="header">
        <h1>Bem-vindo! Complete seu perfil</h1>
        <p>Precisamos de algumas informações para ativar sua conta de perito.</p>
      </div>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-stepper [linear]="true" #stepper class="onboarding-stepper">
          <!-- Step 1: Personal Info -->
          <mat-step [stepControl]="step1Form" label="Dados Pessoais">
            <form [formGroup]="step1Form">
              <div class="step-content">
                <h2>Seus Dados</h2>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nome Completo</mat-label>
                  <input matInput formControlName="full_name" placeholder="Seu nome completo">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Telefone</mat-label>
                  <input matInput formControlName="phone" placeholder="(00) 00000-0000">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Biografia Profissional</mat-label>
                  <textarea matInput formControlName="bio" rows="4" placeholder="Descreva sua experiência..."></textarea>
                </mat-form-field>
                <div class="step-actions">
                  <button mat-flat-button color="primary" (click)="nextStep(stepper)" [disabled]="step1Form.invalid">Próximo</button>
                </div>
              </div>
            </form>
          </mat-step>

          <!-- Step 2: Specialty -->
          <mat-step [stepControl]="step2Form" label="Especialidade">
            <form [formGroup]="step2Form">
              <div class="step-content">
                <h2>Área de Atuação</h2>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Especialidade Principal</mat-label>
                  <input matInput formControlName="specialty" placeholder="Ex: Perícia Contábil">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Cidade</mat-label>
                  <input matInput formControlName="city" placeholder="Sua cidade">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Estado</mat-label>
                  <mat-select formControlName="state">
                    <mat-option value="AC">AC</mat-option><mat-option value="AL">AL</mat-option>
                    <mat-option value="AP">AP</mat-option><mat-option value="AM">AM</mat-option>
                    <mat-option value="BA">BA</mat-option><mat-option value="CE">CE</mat-option>
                    <mat-option value="DF">DF</mat-option><mat-option value="ES">ES</mat-option>
                    <mat-option value="GO">GO</mat-option><mat-option value="MA">MA</mat-option>
                    <mat-option value="MT">MT</mat-option><mat-option value="MS">MS</mat-option>
                    <mat-option value="MG">MG</mat-option><mat-option value="PA">PA</mat-option>
                    <mat-option value="PB">PB</mat-option><mat-option value="PR">PR</mat-option>
                    <mat-option value="PE">PE</mat-option><mat-option value="PI">PI</mat-option>
                    <mat-option value="RJ">RJ</mat-option><mat-option value="RN">RN</mat-option>
                    <mat-option value="RS">RS</mat-option><mat-option value="RO">RO</mat-option>
                    <mat-option value="RR">RR</mat-option><mat-option value="SC">SC</mat-option>
                    <mat-option value="SP">SP</mat-option><mat-option value="SE">SE</mat-option>
                    <mat-option value="TO">TO</mat-option>
                  </mat-select>
                </mat-form-field>
                <div class="tags-section">
                  <label>Tags de especialidade (máx 10)</label>
                  <mat-chip-grid #chipGrid>
                    @for (tag of tags(); track tag) {
                      <mat-chip-row (removed)="removeTag(tag)">{{ tag }}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip-row>
                    }
                    <input placeholder="Nova tag..." [matChipInputFor]="chipGrid" [matChipInputSeparatorKeyCodes]="separatorKeysCodes" (matChipInputTokenEnd)="addTag($event)">
                  </mat-chip-grid>
                </div>
                <div class="step-actions">
                  <button mat-button (click)="stepper.previous()">Voltar</button>
                  <button mat-flat-button color="primary" (click)="nextStep(stepper)" [disabled]="step2Form.invalid">Próximo</button>
                </div>
              </div>
            </form>
          </mat-step>

          <!-- Step 3: Pricing -->
          <mat-step [stepControl]="step3Form" label="Preço e Disponibilidade">
            <form [formGroup]="step3Form">
              <div class="step-content">
                <h2>Configuração de Preço</h2>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Valor Hora (R$)</mat-label>
                  <input matInput type="number" formControlName="hourly_rate" placeholder="300">
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Disponibilidade</mat-label>
                  <mat-select formControlName="availability_status">
                    <mat-option value="available">Disponível</mat-option>
                    <mat-option value="busy">Ocupado</mat-option>
                    <mat-option value="unavailable">Indisponível</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>LinkedIn (opcional)</mat-label>
                  <input matInput formControlName="social_linkedin" placeholder="https://linkedin.com/in/...">
                </mat-form-field>
                <div class="step-actions">
                  <button mat-button (click)="stepper.previous()">Voltar</button>
                  <button mat-flat-button color="primary" (click)="submitOnboarding()" [disabled]="step3Form.invalid || submitting">
                    @if (submitting) { <mat-spinner diameter="20"></mat-spinner> } @else { Enviar para Aprovação }
                  </button>
                </div>
              </div>
            </form>
          </mat-step>
        </mat-stepper>
      }
    </div>
  `,
    styles: [`
    .onboarding-page { max-width:700px; margin:0 auto; padding:40px 24px; }
    .header { text-align:center; margin-bottom:32px; }
    .header h1 { font-size:1.8rem; color:#1a237e; margin-bottom:8px; }
    .header p { color:#666; }
    .loading { display:flex; justify-content:center; padding:60px; }
    .onboarding-stepper { background:white; border-radius:16px; padding:24px; }
    .step-content { padding:16px 0; }
    .step-content h2 { font-size:1.2rem; color:#1a237e; margin-bottom:16px; }
    .full-width { width:100%; margin-bottom:8px; }
    .step-actions { display:flex; justify-content:flex-end; gap:8px; margin-top:24px; }
    .tags-section { margin-top:16px; }
    .tags-section label { display:block; font-size:0.85rem; color:#666; margin-bottom:8px; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertOnboarding implements OnInit {
    private fb = inject(FormBuilder);
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private auth = inject(AuthService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    loading = true;
    submitting = false;
    userId: string | null = null;

    step1Form = this.fb.group({
        full_name: ['', Validators.required],
        phone: [''],
        bio: ['', Validators.minLength(20)],
    });

    step2Form = this.fb.group({
        specialty: ['', Validators.required],
        city: [''],
        state: [''],
    });

    step3Form = this.fb.group({
        hourly_rate: ['', Validators.required],
        availability_status: ['available'],
        social_linkedin: [''],
    });

    readonly separatorKeysCodes = [ENTER, COMMA] as const;
    tags = signal<string[]>([]);

    ngOnInit() {
        setTimeout(() => this.loadOnboarding(), 0);
    }

    async loadOnboarding() {
        await this.auth.initialized;
        const profile = this.auth.userProfile();
        if (!profile) { this.router.navigate(['/login']); return; }
        this.userId = profile.id;

        if (profile.accountStatus !== 'PENDING') {
            this.router.navigate(['/expert-dashboard']);
            return;
        }

        this.step1Form.patchValue({ full_name: `${profile.first_name} ${profile.last_name}`.trim() });
        this.loading = false;
        this.cdr.detectChanges();
    }

    addTag(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();
        if (value && this.tags().length < 10) {
            this.tags.update(tags => [...tags, value]);
        }
        event.chipInput!.clear();
    }

    removeTag(tag: string): void {
        this.tags.update(tags => tags.filter(t => t !== tag));
    }

    nextStep(stepper: any): void {
        stepper.next();
    }

    async submitOnboarding() {
        if (!this.userId || this.submitting) return;
        this.submitting = true;
        try {
            const profileData = {
                id: this.userId,
                ...this.step1Form.value,
                ...this.step2Form.value,
                ...this.step3Form.value,
                tags: this.tags(),
                profile_visible: false,
                account_status: 'PENDING',
                updated_at: new Date().toISOString(),
            };

            const { error } = await this.supabase.upsertProfile(profileData);
            if (error) throw error;

            this.notify.success('Perfil enviado para aprovação! Você será notificado quando for aprovado.');
            this.router.navigate(['/expert-dashboard']);
        } catch (err: any) {
            this.notify.error('Erro ao enviar: ' + err.message);
        } finally {
            this.submitting = false;
            this.cdr.detectChanges();
        }
    }
}
