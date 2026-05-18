import { Component, OnInit, ChangeDetectorRef, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';

@Component({
    standalone: true,
    imports: [CommonModule, RouterModule, FormsModule, MatTableModule, MatButtonModule, MatIconModule, MatSlideToggleModule, MatProgressSpinnerModule, MatFormFieldModule, MatInputModule, MatTooltipModule],
    template: `
    <div class="admin-page">
      <div class="header-row">
        <h1>Páginas de Conteúdo</h1>
        <button mat-raised-button color="primary" (click)="newPage()"><mat-icon>add</mat-icon> Nova Página</button>
      </div>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <table mat-table [dataSource]="pages()" class="full-width">
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Título</th>
            <td mat-cell *matCellDef="let p">{{ p.title }}</td>
          </ng-container>
          <ng-container matColumnDef="slug">
            <th mat-header-cell *matHeaderCellDef>Slug</th>
            <td mat-cell *matCellDef="let p"><code>/{{ p.slug }}</code></td>
          </ng-container>
          <ng-container matColumnDef="published">
            <th mat-header-cell *matHeaderCellDef>Publicado</th>
            <td mat-cell *matCellDef="let p">
              <mat-slide-toggle [checked]="p.published" (change)="togglePublish(p)"></mat-slide-toggle>
            </td>
          </ng-container>
          <ng-container matColumnDef="updated">
            <th mat-header-cell *matHeaderCellDef>Atualizado</th>
            <td mat-cell *matCellDef="let p">{{ p.updated_at | date:'dd/MM/yyyy HH:mm' }}</td>
          </ng-container>
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef></th>
            <td mat-cell *matCellDef="let p">
              <button mat-icon-button (click)="editPage(p)" matTooltip="Editar"><mat-icon>edit</mat-icon></button>
              <button mat-icon-button (click)="deletePage(p)" color="warn" matTooltip="Excluir"><mat-icon>delete</mat-icon></button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns"></tr>
          <tr mat-row *matRowDef="let row; columns: columns;"></tr>
        </table>

        @if (editing) {
          <div class="editor-panel">
            <h3>Editando: {{ editing.title }}</h3>
            <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px;">
              <mat-label>Título</mat-label>
              <input matInput [(ngModel)]="editing.title">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px;">
              <mat-label>Slug</mat-label>
              <input matInput [(ngModel)]="editing.slug">
            </mat-form-field>
            <mat-form-field appearance="outline" style="width:100%;">
              <mat-label>Conteúdo (HTML)</mat-label>
              <textarea matInput [(ngModel)]="editing.content" rows="12" class="content-textarea"></textarea>
            </mat-form-field>
            <div class="editor-actions">
              <span class="preview-hint">O conteúdo aceita HTML. Use <code>&lt;h2&gt;</code>, <code>&lt;p&gt;</code>, etc.</span>
              <div>
                <button mat-stroked-button (click)="cancelEdit()" style="margin-right:8px;">Cancelar</button>
                <button mat-flat-button color="primary" (click)="saveEdit()">Salvar</button>
              </div>
            </div>
          </div>
        }

        @if (pages().length === 0 && !loading) {
          <div class="empty"><mat-icon>article</mat-icon><p>Nenhuma página ainda.</p></div>
        }
      }
    </div>
  `,
    styles: [`
    .full-width { width:100%; }
    .header-row { display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; }
    .header-row h1 { margin:0; }
    .loading { display:flex; justify-content:center; padding:40px; }
    code { background:#f4f5f8; padding:2px 6px; border-radius:4px; font-size:0.85rem; }
    .empty { text-align:center; padding:60px 20px; color:#9CA3AF; }
    .empty mat-icon { font-size:48px; width:48px; height:48px; }
    .editor-panel { background:#fff; padding:20px; border-radius:8px; box-shadow:0 1px 3px rgba(0,0,0,0.08); margin-top:20px; }
    .editor-panel h3 { margin:0 0 16px; font-size:1.1rem; }
    .content-textarea { font-family:monospace; font-size:0.9rem; line-height:1.5; }
    .editor-actions { display:flex; justify-content:space-between; align-items:center; margin-top:12px; }
    .preview-hint { font-size:0.85rem; color:#6B7280; }
    .preview-hint code { font-size:0.8rem; }
  `],
})
export class AdminContentPages implements OnInit {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);

    loading = true;
    pages = signal<any[]>([]);
    columns = ['title', 'slug', 'published', 'updated', 'actions'];
    editing: { id: string; title: string; content: string; slug: string } | null = null;

    ngOnInit() {
        setTimeout(() => this.load(), 0);
    }

    async load() {
        this.loading = true;
        try {
            const { data } = await this.supabase.client.from('content_pages').select('*').order('slug');
            this.pages.set(data ?? []);
        } catch { this.notify.error('Erro ao carregar páginas.'); }
        finally { this.loading = false; this.cdr.detectChanges(); }
    }

    async togglePublish(p: any) {
        const next = !p.published;
        await this.supabase.client.from('content_pages').update({ published: next }).eq('id', p.id);
        p.published = next;
        this.cdr.detectChanges();
    }

    editPage(p: any) {
        this.editing = { id: p.id, title: p.title, content: p.content, slug: p.slug };
    }

    async saveEdit() {
        if (!this.editing) return;
        const { id, title, content, slug } = this.editing;
        await this.supabase.client.from('content_pages').update({ title, content, slug }).eq('id', id);
        this.editing = null;
        await this.load();
        this.notify.success('Página salva.');
    }

    cancelEdit() { this.editing = null; }

    async deletePage(p: any) {
        if (!window.confirm(`Excluir "${p.title}"?`)) return;
        await this.supabase.client.from('content_pages').delete().eq('id', p.id);
        this.pages.update(list => list.filter(x => x.id !== p.id));
        this.notify.success('Página excluída.');
    }

    async newPage() {
        const slug = prompt('Slug (ex: termos-de-uso):');
        if (!slug) return;
        const title = prompt('Título:');
        if (!title) return;
        await this.supabase.client.from('content_pages').insert({ slug, title, content: '', published: false });
        await this.load();
        this.notify.success('Página criada.');
    }
}
