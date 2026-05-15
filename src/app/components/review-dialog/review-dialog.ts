import { Component, Inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../services/supabase.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-review-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title>Avaliar {{ data.expertName }}</h2>
    <mat-dialog-content>
      <div class="rating-section">
        <p>Sua avaliação:</p>
        <div class="stars">
          @for (star of [1,2,3,4,5]; track star) {
            <mat-icon 
              [class.filled]="star <= selectedRating"
              (click)="setRating(star)">
              {{ star <= selectedRating ? 'star' : 'star_border' }}
            </mat-icon>
          }
        </div>
      </div>
      <form [formGroup]="reviewForm">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Comentário (opcional)</mat-label>
          <textarea matInput formControlName="comment" rows="4" 
            placeholder="Conte sua experiência com este profissional..."></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Cancelar</button>
      <button mat-raised-button color="primary" [disabled]="selectedRating === 0 || loading" (click)="onSubmit()">
        {{ loading ? 'Enviando...' : 'Enviar Avaliação' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .full-width { width: 100%; }
    mat-dialog-content { min-width: 350px; }
    .rating-section { 
      text-align: center; 
      margin-bottom: 20px;
    }
    .rating-section p { margin-bottom: 10px; color: #666; }
    .stars {
      display: flex;
      justify-content: center;
      gap: 8px;
    }
    .stars mat-icon {
      font-size: 36px;
      width: 36px;
      height: 36px;
      cursor: pointer;
      color: #ccc;
      transition: color 0.2s, transform 0.2s;
    }
    .stars mat-icon:hover { transform: scale(1.1); }
    .stars mat-icon.filled { color: #ffc107; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReviewDialog {
  reviewForm: FormGroup;
  selectedRating = 0;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
    public dialogRef: MatDialogRef<ReviewDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { expertId: string; expertName: string; clientId: string; leadId?: string }
  ) {
    this.reviewForm = this.fb.group({
      comment: ['']
    });
  }

  setRating(rating: number) {
    this.selectedRating = rating;
  }

  async onSubmit() {
    if (this.selectedRating > 0) {
      this.loading = true;
      try {
        const { error } = await this.supabaseService.createReview({
          expert_id: this.data.expertId,
          client_id: this.data.clientId,
          rating: this.selectedRating,
          comment: this.reviewForm.value.comment,
          lead_id: this.data.leadId
        });

        if (error) throw error;

        this.snackBar.open('Avaliação enviada com sucesso!', 'Fechar', { duration: 3000 });
        this.dialogRef.close(true);
      } catch (error: any) {
        this.snackBar.open('Erro ao enviar avaliação: ' + error.message, 'Fechar', { duration: 3000 });
      } finally {
        this.loading = false;
        this.cdr.detectChanges();
      }
    }
  }
}
