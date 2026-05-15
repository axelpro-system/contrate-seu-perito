import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SupabaseService } from '../../services/supabase.service';
import { QuoteService } from '../../services/quote.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';
import { newLeadEmail } from '../../services/email-templates';

@Component({
  selector: 'app-hire-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Contratar {{ data.expertName }}</h2>
    <mat-dialog-content>
      <form [formGroup]="hireForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Seu nome</mat-label>
          <input matInput formControlName="requesterName" placeholder="Nome completo">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Email</mat-label>
          <input matInput formControlName="requesterEmail" type="email" placeholder="seu@email.com">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Telefone (opcional)</mat-label>
          <input matInput formControlName="requesterPhone" placeholder="(00) 00000-0000">
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Mensagem</mat-label>
          <textarea matInput formControlName="caseDescription" rows="4" placeholder="Descreva o serviço que você precisa..."></textarea>
          <mat-error *ngIf="hireForm.get('caseDescription')?.hasError('required')">
            A mensagem é obrigatória.
          </mat-error>
          <mat-error *ngIf="hireForm.get('caseDescription')?.hasError('minlength')">
            Mínimo de 20 caracteres.
          </mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="hireForm.invalid || loading" (click)="onSubmit()">
        {{ loading ? 'Enviando...' : 'Enviar Pedido' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 300px; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HireDialog {
  hireForm: FormGroup;
  loading = false;
  private auth = inject(AuthService);
  private quoteService = inject(QuoteService);

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private snackBar: MatSnackBar,
    private notifSvc: NotificationService,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<HireDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { expertId: string; expertName: string; clientId: string }
  ) {
    this.hireForm = this.fb.group({
      requesterName: ['', Validators.required],
      requesterEmail: ['', [Validators.required, Validators.email]],
      requesterPhone: [''],
      caseDescription: ['', [Validators.required, Validators.minLength(20)]]
    });

    this.auth.initialized.then(() => {
      const profile = this.auth.userProfile();
      if (profile) {
        this.hireForm.patchValue({
          requesterName: `${profile.first_name} ${profile.last_name}`.trim(),
          requesterEmail: profile.contact_email,
        });
      }
    });
  }

  async onSubmit() {
    if (this.hireForm.valid) {
      this.loading = true;
      try {
        const profile = this.auth.userProfile();
        const { error } = await this.quoteService.createQuote({
          expertId: this.data.expertId,
          requesterId: profile?.id,
          ...this.hireForm.value,
        });

        if (error) throw error;

        this.supabaseService.getProfile(this.data.expertId).then(async ({ data: expert }) => {
          if (expert?.contact_email) {
            const emailResult = await this.supabaseService.sendNotificationEmail(
              expert.contact_email,
              'Nova solicitação de cotação',
              newLeadEmail({
                expertName: expert.first_name || 'Perito',
                clientName: this.hireForm.value.requesterName || 'Contratante',
                caseDescription: this.hireForm.value.caseDescription,
                expertQuotesUrl: `${window.location.origin}/expert/quotes`,
              }),
              'Contrate seu Perito - Nova Cotação'
            );
            
            if (!emailResult.success) {
              console.error('Falha ao enviar email para o perito:', emailResult.error);
              if (emailResult.code === 'BOUNCE_INVALID_RECIPIENT') {
                this.snackBar.open('Email do perito está inválido ou inativo. Notificação enviada apenas internamente.', 'Fechar', { duration: 5000 });
              }
            }
            
            // Sempre criar notificacao interna, independente do email
            this.notifSvc.createNotification(this.data.expertId, 'new_quote',
              'Nova solicitação de cotação',
              `Um contratante está interessado em seus serviços.`);
          }
        });

        this.snackBar.open('Pedido enviado com sucesso!', 'Fechar', { duration: 3000 });
        this.dialogRef.close(true);
      } catch (error: any) {
        this.snackBar.open('Erro ao enviar pedido: ' + error.message, 'Fechar', { duration: 3000 });
      } finally {
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }
}
