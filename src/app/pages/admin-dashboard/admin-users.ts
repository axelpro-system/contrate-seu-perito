import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, signal, computed } from '@angular/core';
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
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { ExportService } from '../../services/export.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatSlideToggleModule,
        MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatTooltipModule, RouterModule],
    template: `
    <div class="admin-page">
      <div class="header-row">
        <h1>Usuários</h1>
        <span class="count">{{ filteredUsers().length }} usuário{{ filteredUsers().length !== 1 ? 's' : '' }}</span>
        <button mat-raised-button color="primary" routerLink="/admin/users/new" class="new-btn">
          <mat-icon>person_add</mat-icon> Novo Usuário
        </button>
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
        <button mat-stroked-button (click)="exportFiltered()" class="export-btn" matTooltip="Exportar filtrados">
          <mat-icon>file_download</mat-icon> Exportar
        </button>
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
                <button mat-icon-button (click)="deleteUser(u)" matTooltip="Excluir" color="warn"><mat-icon>delete</mat-icon></button>
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
    .empty p { color:#9CA3AF; }
    .new-btn { margin-left:auto; }
    .export-btn { align-self:center; }
    .delete-btn-cell { color:#DC2626; }`],

})
export class AdminUsers implements OnInit, OnDestroy {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private exportSvc = inject(ExportService);
    private cdr = inject(ChangeDetectorRef);
    loading = true;
    users = signal<any[]>([]);
    columns = ['name', 'email', 'type', 'visible', 'actions'];
    searchQuery = signal('');
    filterType = signal('');
    filterVisible = signal('');
    private channel: any = null;

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
        this.subscribeRealtime();
    }

    ngOnDestroy() {
        if (this.channel) {
            this.supabase.client.removeChannel(this.channel);
        }
    }

    private subscribeRealtime() {
        this.channel = this.supabase.client.channel('admin-users')
            .on('postgres_changes' as any,
                { event: '*', schema: 'public', table: 'profiles' },
                (payload: RealtimePostgresChangesPayload<any>) => {
                    const event = payload.eventType;
                    const record = payload.new;
                    const oldId = (payload.old as any)?.id;

                    if (event === 'INSERT' && record) {
                        this.users.update(list => [record, ...list]);
                    } else if (event === 'UPDATE' && record) {
                        this.users.update(list => list.map(u => u.id === record.id ? { ...u, ...record } : u));
                    } else if (event === 'DELETE' && oldId) {
                        this.users.update(list => list.filter(u => u.id !== oldId));
                    }
                    this.cdr.detectChanges();
                })
            .subscribe();
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

    async deleteUser(user: any) {
        const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.contact_email || user.email || 'este usuário';
        const confirmed = window.confirm(`Tem certeza que deseja excluir permanentemente ${name}?\n\nIsso removerá o usuário de auth e todos os dados associados.`);
        if (!confirmed) return;

        try {
            const { error } = await this.supabase.client.functions.invoke('delete-user', {
                body: { userId: user.id }
            });
            if (error) throw error;
            this.users.update(list => list.filter(u => u.id !== user.id));
            this.notify.success(`${name} excluído com sucesso.`);
        } catch (err: any) {
            console.error('Error deleting user:', err);
            const msg = err?.message || err?.error_description || err?.details || 'Erro ao excluir usuário';
            this.notify.error(msg);
        } finally {
            this.cdr.detectChanges();
        }
    }

    exportFiltered() {
        const data = this.filteredUsers();
        if (data.length === 0) {
            this.notify.info('Nenhum usuário para exportar.');
            return;
        }

        const header = 'Nome,Email,Tipo,Status,Visível,Cidade,Estado,Última Atualização';
        const rows = data.map((u: any) => {
            const name = `"${(u.full_name || `${u.first_name || ''} ${u.last_name || ''}`).replace(/"/g, '""')}"`;
            const email = `"${(u.contact_email || u.email || '').replace(/"/g, '""')}"`;
            const type = this.profileLabel(u.profile_type);
            const status = u.account_status || '';
            const vis = u.profile_visible ? 'Sim' : 'Não';
            const city = `"${(u.city || '').replace(/"/g, '""')}"`;
            const state = `"${(u.state || '').replace(/"/g, '""')}"`;
            const updated = u.updated_at ? new Date(u.updated_at).toLocaleString('pt-BR') : '';
            return `${name},${email},${type},${status},${vis},${city},${state},${updated}`;
        }).join('\n');

        const csv = '\uFEFF' + header + '\n' + rows;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `usuarios_filtrados_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        this.notify.success(`Exportados ${data.length} usuários.`);
    }
}
