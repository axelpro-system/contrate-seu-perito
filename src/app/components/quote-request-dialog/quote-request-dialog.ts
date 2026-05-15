import { Component, Inject, ChangeDetectorRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { QuoteService } from '../../services/quote.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

export interface DialogData {
    expertId: string;
    expertName: string;
}

@Component({
    selector: 'app-quote-request-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        ReactiveFormsModule
    ],
    template: `
    <h2 mat-dialog-title>Solicitar Cotação — {{ data.expertName }}</h2>
    <mat-dialog-content>
      <form [formGroup]="quoteForm">
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
          <mat-label>Descrição do caso</mat-label>
          <textarea matInput formControlName="caseDescription" rows="4" placeholder="Descreva o serviço que você precisa..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()" [disabled]="loading">Cancelar</button>
      <button mat-flat-button color="primary" (click)="onSubmit()" [disabled]="quoteForm.invalid || loading">
        @if (loading) { <mat-spinner diameter="20"></mat-spinner> } @else { Enviar Solicitação }
      </button>
    </mat-dialog-actions>
  `,
    styles: [`.full-width { width:100%; } mat-dialog-actions { padding:16px 24px; gap:8px; }`],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuoteRequestDialog {
    private fb = inject(FormBuilder);
    private quoteService = inject(QuoteService);
    private notify = inject(NotificationService);
    private auth = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    quoteForm: FormGroup;
    loading = false;

    constructor(
        public dialogRef: MatDialogRef<QuoteRequestDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData
    ) {
        this.quoteForm = this.fb.group({
            requesterName: ['', Validators.required],
            requesterEmail: ['', [Validators.required, Validators.email]],
            requesterPhone: [''],
            caseDescription: ['', [Validators.required, Validators.minLength(20)]],
        });

        this.auth.initialized.then(() => {
            const profile = this.auth.userProfile();
            if (profile) {
                this.quoteForm.patchValue({
                    requesterName: `${profile.first_name} ${profile.last_name}`.trim(),
                    requesterEmail: profile.contact_email,
                });
            }
        });
    }

    async onSubmit() {
        if (this.quoteForm.invalid || this.loading) return;
        this.loading = true;
        try {
            const profile = this.auth.userProfile();
            const { error } = await this.quoteService.createQuote({
                expertId: this.data.expertId,
                requesterId: profile?.id,
                ...this.quoteForm.value,
            });
            if (error) throw error;
            this.notify.success('Solicitação enviada com sucesso!');
            this.dialogRef.close(true);
        } catch (err: any) {
            this.notify.error('Erro ao enviar: ' + err.message);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }
}
