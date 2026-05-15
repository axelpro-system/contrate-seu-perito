import { Component, OnInit, ChangeDetectorRef, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatSlideToggleModule,
        MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatSelectModule, RouterModule],
    template: `
    <div class="admin-page">
      <div class="header-row">
        <h1>Usuários</h1>
        <span class="count">{{ filteredUsers().length }} usuário{{ filteredUsers().length !== 1 ? 's' : '' }}</span>
      </div>

      <div class="filters-bar">
        <mat-form-field appearance="outline" class="search-field">
          <mat-label>Buscar</mat-label>
          <input matInput [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)" placeholder="Nome ou email...">
          <mat-icon matSuffix>search</mat-icon>
        </mat-form-field>
        <mat-form-field appearance="outline" class="type-field">
          <mat-label>Tipo</mat-label>
          <mat-select [ngModel]="filterType()" (ngModelChange)="filterType.set($event)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="PERITO">Perito</mat-option>
            <mat-option value="CONTRATANTE">Contratante</mat-option>
            <mat-option value="ADMIN">Admin</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="visible-field">
          <mat-label>Visível</mat-label>
          <mat-select [ngModel]="filterVisible()" (ngModelChange)="filterVisible.set($event)">
            <mat-option value="">Todos</mat-option>
            <mat-option value="true">Visível</mat-option>
            <mat-option value="false">Oculto</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <div class="table-wrapper">
          <table mat-table [dataSource]="filteredUsers()" class="full-width">
            <ng-container matColumnDef="name">
              <th mat-header-cell *matHeaderCellDef>Nome</th>
              <td mat-cell *matCellDef="let u">{{ u.first_name }} {{ u.last_name }}</td>
            </ng-container>
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef>Email</th>
              <td mat-cell *matCellDef="let u">{{ u.contact_email }}</td>
            </ng-container>
            <ng-container matColumnDef="type">
              <th mat-header-cell *matHeaderCellDef>Tipo</th>
              <td mat-cell *matCellDef="let u"><span class="type-badge" [class]="u.profile_type?.toLowerCase()">{{ profileLabel(u.profile_type) }}</span></td>
            </ng-container>
            <ng-container matColumnDef="visible">
              <th mat-header-cell *matHeaderCellDef>Visível</th>
              <td mat-cell *matCellDef="let u">
                <mat-slide-toggle [checked]="u.profile_visible" (change)="toggleVisibility(u)" [disabled]="u.profile_type !== 'PERITO'"></mat-slide-toggle>
              </td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Ações</th>
              <td mat-cell *matCellDef="let u">
                <button mat-icon-button [routerLink]="['/admin/users', u.id, 'edit']" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columns"></tr>
            <tr mat-row *matRowDef="let row; columns: columns;"></tr>
          </table>
        </div>

        @if (filteredUsers().length === 0) {
          <div class="empty">
            <mat-icon>search_off</mat-icon>
            <p>Nenhum usuário encontrado com esses filtros.</p>
          </div>
        }
      }
    </div>
  `,
    styles: [`
    .full-width { width:100%; }
    .header-row { display:flex; align-items:baseline; gap:12px; margin-bottom:20px; }
    .header-row h1 { margin:0; }
    .header-row .count { color:#6B7280; font-size:0.9rem; }
    .filters-bar { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
    .filters-bar .search-field { flex:1; min-width:200px; }
    .filters-bar .type-field { width:180px; }
    .filters-bar .visible-field { width:140px; }
    .table-wrapper { overflow-x:auto; }
    .loading{display:flex;justify-content:center;padding:40px;}
    .type-badge { display:inline-block; padding:2px 10px; border-radius:999px; font-size:0.8rem; font-weight:500; }
    .type-badge.perito { background:#E0F2FE; color:#0369A1; }
    .type-badge.contratante { background:#F3E8FF; color:#7C3AED; }
    .type-badge.admin { background:#FEE2E2; color:#DC2626; }
    .empty { text-align:center; padding:60px 20px; }
    .empty mat-icon { font-size:48px; width:48px; height:48px; color:#D1D5DB; margin-bottom:12px; }
    .empty p { color:#9CA3AF; }`],

})
export class AdminUsers implements OnInit {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);
    loading = true;
    users = signal<any[]>([]);
    columns = ['name', 'email', 'type', 'visible', 'actions'];
    searchQuery = signal('');
    filterType = signal('');
    filterVisible = signal('');

    filteredUsers = computed(() => {
        let list = this.users();
        const q = this.searchQuery().toLowerCase().trim();

        if (q) {
            list = list.filter(u =>
                (u.first_name || '').toLowerCase().includes(q) ||
                (u.last_name || '').toLowerCase().includes(q) ||
                `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase().includes(q) ||
                (u.contact_email || '').toLowerCase().includes(q)
            );
        }

        if (this.filterType()) {
            list = list.filter(u => u.profile_type === this.filterType());
        }

        if (this.filterVisible() !== '') {
            const vis = this.filterVisible() === 'true';
            list = list.filter(u => u.profile_visible === vis);
        }

        return list;
    });

    ngOnInit() {
        setTimeout(() => this.loadUsers(), 0);
    }

    async loadUsers() {
        this.loading = true;
        try {
            const { data, error } = await this.supabase.client
                .from('profiles').select('*')
                .order('updated_at', { ascending: false });
            if (error) throw error;
            this.users.set(data ?? []);
        } catch (err: any) {
            console.error('Error loading users:', err);
            const msg = err?.message || err?.error_description || err?.error || err?.details || 'desconhecido';
            this.notify.error('Erro: ' + msg);
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    profileLabel(type: string): string {
        switch (type) {
            case 'PERITO': return 'Perito';
            case 'CONTRATANTE': return 'Contratante';
            case 'ADMIN': return 'Admin';
            default: return type;
        }
    }

    async toggleVisibility(user: any) {
        const next = !user.profile_visible;
        try {
            await this.supabase.client.from('profiles').update({ profile_visible: next }).eq('id', user.id);
            user.profile_visible = next;
            this.notify.success('Visibilidade atualizada.');
        } catch {
            this.notify.error('Erro ao atualizar visibilidade.');
        } finally {
            this.cdr.detectChanges();
        }
    }
}
