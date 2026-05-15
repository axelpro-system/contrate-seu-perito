import { Component, OnInit, ChangeDetectorRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
import { AuthService } from '../../services/auth.service';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatButtonModule, MatSlideToggleModule, MatProgressSpinnerModule, MatTabsModule, MatChipsModule, MatIconModule],
    template: `
    <div class="admin-page">
      <div class="header">
        <h1>Editar {{ isExpert ? 'Perito' : 'Usuário' }}</h1>
        <button mat-stroked-button (click)="router.navigate(['/admin/users'])"><mat-icon>arrow_back</mat-icon> Voltar</button>
      </div>

      @if (loading) {
        <div class="loading"><mat-spinner diameter="40"></mat-spinner></div>
      } @else {
        <mat-tab-group>
          <!-- Tab: Dados Básicos -->
          <mat-tab label="Dados Básicos">
            <div class="tab-content">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Nome</mat-label>
                  <input matInput [(ngModel)]="user.first_name">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Sobrenome</mat-label>
                  <input matInput [(ngModel)]="user.last_name">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Email</mat-label>
                  <input matInput [(ngModel)]="user.contact_email">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Telefone</mat-label>
                  <input matInput [(ngModel)]="user.phone">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Tipo</mat-label>
                  <mat-select [(ngModel)]="user.profile_type">
                    <mat-option value="PERITO">Perito</mat-option>
                    <mat-option value="CONTRATANTE">Contratante</mat-option>
                    <mat-option value="ADMIN">Admin</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Status da Conta</mat-label>
                  <mat-select [(ngModel)]="user.account_status">
                    <mat-option value="PENDING">Pendente</mat-option>
                    <mat-option value="ACTIVE">Ativo</mat-option>
                    <mat-option value="REJECTED">Rejeitado</mat-option>
                    <mat-option value="SUSPENDED">Suspenso</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
              <div class="toggles">
                <mat-slide-toggle [(ngModel)]="user.profile_visible">Perfil visível</mat-slide-toggle>
              </div>
              <div class="actions">
                <button mat-flat-button color="primary" (click)="save()" [disabled]="saving">
                  {{ saving ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>
            </div>
          </mat-tab>

          <!-- Tab: Dados do Perito (só aparece se for PERITO) -->
          @if (isExpert) {
          <mat-tab label="Dados do Perito">
            <div class="tab-content">
              <div class="form-grid">
                <mat-form-field appearance="outline">
                  <mat-label>Especialidade</mat-label>
                  <input matInput [(ngModel)]="user.specialty">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Cidade</mat-label>
                  <input matInput [(ngModel)]="user.city">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Estado</mat-label>
                  <mat-select [(ngModel)]="user.state">
                    <mat-option value="">-</mat-option>
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
                <mat-form-field appearance="outline">
                  <mat-label>Valor Hora (R$)</mat-label>
                  <input matInput type="number" [(ngModel)]="user.hourly_rate">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Disponibilidade</mat-label>
                  <mat-select [(ngModel)]="user.availability_status">
                    <mat-option value="available">Disponível</mat-option>
                    <mat-option value="busy">Ocupado</mat-option>
                    <mat-option value="unavailable">Indisponível</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Rating</mat-label>
                  <input matInput type="number" [(ngModel)]="user.rating">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>LinkedIn</mat-label>
                  <input matInput [(ngModel)]="user.social_linkedin" placeholder="https://linkedin.com/in/...">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Website</mat-label>
                  <input matInput [(ngModel)]="user.social_website" placeholder="https://...">
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px;">
                <mat-label>Biografia</mat-label>
                <textarea matInput [(ngModel)]="user.bio" rows="4"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" style="width:100%;margin-bottom:12px;">
                <mat-label>URL do Currículo</mat-label>
                <input matInput [(ngModel)]="user.cv_url">
              </mat-form-field>

              <!-- Tags -->
              <div class="tags-section">
                <label>Tags</label>
                <div class="tags-list">
                  @for (tag of userTags; track tag; let i = $index) {
                    <mat-chip (removed)="removeTag(i)">{{ tag }}<button matChipRemove><mat-icon>cancel</mat-icon></button></mat-chip>
                  }
                </div>
                <mat-form-field appearance="outline" class="tag-input">
                  <mat-label>Nova tag</mat-label>
                  <input matInput [(ngModel)]="newTag" (keyup.enter)="addTag()">
                </mat-form-field>
              </div>

              <div class="actions">
                <button mat-flat-button color="primary" (click)="save()" [disabled]="saving">
                  {{ saving ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>
            </div>
          </mat-tab>
          }

          <!-- Tab: Aprovação (só aparece se for PERITO) -->
          @if (isExpert) {
          <mat-tab label="Aprovação">
            <div class="tab-content">
              <div class="approval-info">
                <p><strong>Status:</strong> {{ statusLabel(user.account_status) }}</p>
                @if (user.approved_at) { <p><strong>Aprovado em:</strong> {{ user.approved_at | date:'dd/MM/yyyy HH:mm' }}</p> }
                @if (user.approved_by) { <p><strong>Aprovado por:</strong> {{ user.approved_by }}</p> }
              </div>
              <div class="toggles" style="margin-bottom:20px;">
                <mat-slide-toggle [(ngModel)]="user.is_verified" (change)="save()">
                  Perito Verificado
                </mat-slide-toggle>
                <mat-slide-toggle [(ngModel)]="user.is_featured" (change)="save()">
                  Perito em Destaque
                </mat-slide-toggle>
              </div>
              <div class="approval-actions">
                <button mat-flat-button color="primary" (click)="approve()" [disabled]="saving || user.account_status === 'ACTIVE'">
                  <mat-icon>check</mat-icon> Aprovar Perito
                </button>
                <button mat-flat-button color="warn" (click)="reject()" [disabled]="saving || user.account_status === 'REJECTED'">
                  <mat-icon>close</mat-icon> Rejeitar Perito
                </button>
              </div>
            </div>
          </mat-tab>
          }
        </mat-tab-group>
      }
    </div>
  `,
    styles: [`
      .header { display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; }
      .header h1 { margin:0; }
      .tab-content { padding:24px 16px; max-width:700px; }
      .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
      .toggles { margin-bottom:20px; }
      .actions { margin-top:20px; display:flex; gap:12px; }
      .tags-section { margin-bottom:20px; }
      .tags-section label { display:block; font-size:0.85rem; color:#666; margin-bottom:8px; }
      .tags-list { display:flex; flex-wrap:wrap; gap:8px; margin-bottom:12px; }
      .tag-input { width:100%; }
      .approval-info { background:#f5f5f5; padding:16px; border-radius:8px; margin-bottom:20px; }
      .approval-info p { margin:8px 0; }
      .approval-actions { display:flex; gap:12px; }
      @media (max-width:768px) { .form-grid { grid-template-columns:1fr; } }
    `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserEdit implements OnInit {
    private supabase = inject(SupabaseService);
    private auth = inject(AuthService);
    private route = inject(ActivatedRoute);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);
    user: any = {};
    loading = false;
    saving = false;
    newTag = '';

    get isExpert(): boolean {
        return this.user?.profile_type === 'PERITO';
    }

    get userTags(): string[] {
        return Array.isArray(this.user?.tags) ? this.user.tags : [];
    }

    constructor(public router: Router) { }

    ngOnInit() {
        setTimeout(() => this.loadUser(), 0);
    }

    async loadUser() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loading = true;
            try {
                const { data } = await this.supabase.getProfile(id);
                if (data) this.user = data;
            } catch {
                this.notify.error('Erro ao carregar usuário.');
            } finally {
                this.loading = false;
                this.cdr.detectChanges();
            }
        }
    }

    async save() {
        this.saving = true;
        try {
            await this.supabase.adminUpdateProfile(this.user.id, this.user);
            this.notify.success('Usuário atualizado.');
            this.router.navigate(['/admin/users']);
        } catch {
            this.notify.error('Erro ao salvar usuário.');
        } finally {
            this.saving = false;
        }
    }

    addTag() {
        if (!this.newTag.trim()) return;
        const tags = [...this.userTags, this.newTag.trim()];
        this.user.tags = tags;
        this.newTag = '';
        this.cdr.detectChanges();
    }

    removeTag(index: number) {
        const tags = [...this.userTags];
        tags.splice(index, 1);
        this.user.tags = tags;
        this.cdr.detectChanges();
    }

    statusLabel(status: string): string {
        switch (status) {
            case 'PENDING': return 'Pendente';
            case 'ACTIVE': return 'Ativo';
            case 'REJECTED': return 'Rejeitado';
            case 'SUSPENDED': return 'Suspenso';
            default: return status || 'N/A';
        }
    }

    async approve() {
        this.saving = true;
        try {
            const profile = this.auth.userProfile();
            await this.supabase.approveExpert(this.user.id, profile?.id || '');
            this.user.account_status = 'ACTIVE';
            this.user.approved_at = new Date().toISOString();
            this.user.approved_by = profile?.id;
            this.notify.success('Perito aprovado!');
            this.cdr.detectChanges();
        } catch {
            this.notify.error('Erro ao aprovar perito.');
        } finally {
            this.saving = false;
        }
    }

    async reject() {
        this.saving = true;
        try {
            await this.supabase.rejectExpert(this.user.id);
            this.user.account_status = 'REJECTED';
            this.notify.success('Perito rejeitado.');
            this.cdr.detectChanges();
        } catch {
            this.notify.error('Erro ao rejeitar perito.');
        } finally {
            this.saving = false;
        }
    }
}
