import { Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatTooltipModule],
    template: `
    <div class="admin-page">
      <div class="header-row">
        <h1>Templates de Email</h1>
        <button mat-raised-button color="primary" (click)="newTemplate()"><mat-icon>add</mat-icon> Novo Template</button>
      </div>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <table mat-table [dataSource]="templates()" class="full-width">
          <ng-container matColumnDef="slug">
            <th mat-header-cell *matHeaderCellDef>Slug</th>
            <td mat-cell *matCellDef="let t"><code>{{ t.slug }}</code></td>
          </ng-container>
          <ng-container matColumnDef="subject">
            <th mat-header-cell *matHeaderCellDef>Assunto</th>
            <td mat-cell *matCellDef="let t">{{ t.subject }}</td>
          </ng-container>
          <ng-container matColumnDef="variables">
            <th mat-header-cell *matHeaderCellDef>Variáveis</th>
            <td mat-cell *matCellDef="let t">
              @for (v of t.variables; track v) { <span class="var-badge">{{ v }}</span> }
            </td>
          </ng-container>
          <ng-container matColumnDef="updated">
            <th mat-header-cell *matHeaderCellDef>Atualizado</th>
            <td mat-cell *matCellDef="let t">{{ t.updated_at | date:'dd/MM/yyyy' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let t">
              <button mat-icon-button (click)="editTemplate(t)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button (click)="deleteTemplate(t)" color="warn"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>

        @if (templates().length === 0) {
          <div class="empty"><mat-icon>email</mat-icon><p>Nenhum template.</p></div>
        }
      }

      @if (editing) {
        <div class="editor-panel">
          <h3>{{ editing.id ? 'Editando: ' + editing.slug : 'Novo Template' }}</h3>
          <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px;">
            <mat-label>Slug</mat-label>
            <input matInput [(ngModel)]="editing.slug" placeholder="welcome-email">
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px;">
            <mat-label>Assunto</mat-label>
            <input matInput [(ngModel)]="editing.subject" placeholder="Bem-vindo [nome]!">
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px;">
            <mat-label>Variáveis (separadas por vírgula)</mat-label>
            <input matInput [(ngModel)]="editing.varsStr" placeholder="name, email, link">
          </mat-form-field>
          <mat-form-field appearance="outline" style="width:100%;">
            <mat-label>HTML do corpo</mat-label>
            <textarea matInput [(ngModel)]="editing.html_body" rows="10" class="code-area"></textarea>
          </mat-form-field>
          <div class="preview-box">
            <strong>Preview do assunto:</strong> {{ editing.subject }}
          </div>
          <div class="editor-actions">
            <div>
              <button mat-stroked-button (click)="cancelEdit()" style="margin-right:8px;">Cancelar</button>
              <button mat-flat-button color="primary" (click)="saveEdit()">Salvar</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
    styles: [`
    .full-width { width:100%; }
    .header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .header-row h1 { margin:0; }
    .loading { display:flex; justify-content:center; padding:40px; }
    code { background:#f4f5f8; padding:2px 6px; border-radius:4px; font-size:0.85rem; }
    .var-badge { display:inline-block; background:#E0F2FE; color:#0369A1; padding:1px 8px; border-radius:999px; font-size:0.75rem; margin:1px; }
    .empty { text-align:center; padding:60px 20px; color:#9CA3AF; }
    .empty mat-icon { font-size:48px; width:48px; height:48px; }
    .editor-panel { background:#fff; padding:20px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.08); margin-top:20px; }
    .editor-panel h3 { margin:0 0 16px; }
    .code-area { font-family:monospace; font-size:0.9rem; line-height:1.5; }
    .preview-box { margin:12px 0; padding:12px; background:#f9fafb; border-radius:6px; font-size:0.9rem; }
    .editor-actions { display:flex; justify-content:flex-end; margin-top:12px; }
  `],
})
export class AdminEmailTemplates implements OnInit {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);

    loading = true;
    templates = signal<any[]>([]);
    columns = ['slug', 'subject', 'variables', 'updated', 'actions'];
    editing: { id?: string; slug: string; subject: string; html_body: string; varsStr: string } | null = null;

    ngOnInit() { setTimeout(() => this.load(), 0); }

    async load() {
        this.loading = true;
        const { data } = await this.supabase.client.from('email_templates').select('*').order('slug');
        this.templates.set(data ?? []);
        this.loading = false;
        this.cdr.detectChanges();
    }

    editTemplate(t: any) {
        this.editing = { id: t.id, slug: t.slug, subject: t.subject, html_body: t.html_body, varsStr: (t.variables || []).join(', ') };
    }

    cancelEdit() { this.editing = null; }

    async saveEdit() {
        if (!this.editing || !this.editing.slug || !this.editing.subject) return;
        const { id, slug, subject, html_body, varsStr } = this.editing;
        const variables = varsStr.split(',').map((v: string) => v.trim()).filter(Boolean);
        const data = { slug, subject, html_body, variables };

        if (id) {
            await this.supabase.client.from('email_templates').update(data).eq('id', id);
        } else {
            await this.supabase.client.from('email_templates').insert(data);
        }
        this.editing = null;
        await this.load();
        this.notify.success('Template salvo.');
    }

    async deleteTemplate(t: any) {
        if (!window.confirm(`Excluir template "${t.slug}"?`)) return;
        await this.supabase.client.from('email_templates').delete().eq('id', t.id);
        this.templates.update(list => list.filter(x => x.id !== t.id));
        this.notify.success('Template excluído.');
    }

    async newTemplate() {
        this.editing = { slug: '', subject: '', html_body: '<h2>Olá {{name}}!</h2><p>Conteúdo aqui.</p>', varsStr: 'name' };
    }
}
