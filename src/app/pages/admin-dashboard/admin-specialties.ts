import { Component, OnInit, ChangeDetectorRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { NotificationService } from '../../services/notification.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatProgressSpinnerModule],
    template: `
    <div class="admin-page">
      <h1>Especialidades</h1>
      <div style="display:flex;gap:8px;margin-bottom:20px;">
        <mat-form-field appearance="outline" style="flex:1;">
          <mat-label>Nova especialidade</mat-label>
          <input matInput [(ngModel)]="newLabel" (keyup.enter)="add()">
        </mat-form-field>
        <button mat-flat-button color="primary" (click)="add()" [disabled]="loading">Adicionar</button>
      </div>
      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <table mat-table [dataSource]="specialties" class="full-width">
          <ng-container matColumnDef="label">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let s">{{ s.label }}</td>
          </ng-container>
          <ng-container matColumnDef="active">
            <th mat-header-cell *matHeaderCellDef>Ativa</th>
            <td mat-cell *matCellDef="let s">
              <mat-slide-toggle [checked]="s.active" (change)="toggle(s)"></mat-slide-toggle>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="['label','active']"></tr>
          <tr mat-row *matRowDef="let row; columns: ['label','active'];"></tr>
        </table>
      }
    </div>
  `,
    styles: [`.full-width { width:100%; }.loading{display:flex;justify-content:center;padding:40px;}`],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSpecialties implements OnInit {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);
    specialties: any[] = [];
    newLabel = '';
    loading = true;

    ngOnInit() {
        setTimeout(() => this.loadSpecialties(), 0);
    }

    async loadSpecialties() {
        this.loading = true;
        try {
            const { data } = await this.supabase.client.from('specialties').select('*').order('label');
            this.specialties = data ?? [];
        } catch {
            this.notify.error('Erro ao carregar especialidades.');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async add() {
        if (!this.newLabel.trim()) return;
        try {
            await this.supabase.client.from('specialties').insert({ label: this.newLabel.trim() });
            this.newLabel = '';
            await this.loadSpecialties();
            this.notify.success('Especialidade adicionada.');
        } catch {
            this.notify.error('Erro ao adicionar especialidade.');
        } finally {
            this.cdr.detectChanges();
        }
    }

    async toggle(s: any) {
        try {
            await this.supabase.client.from('specialties').update({ active: !s.active }).eq('id', s.id);
            s.active = !s.active;
        } catch {
            this.notify.error('Erro ao atualizar especialidade.');
        } finally {
            this.cdr.detectChanges();
        }
    }
}
