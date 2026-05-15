import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { QuoteService } from '../../services/quote.service';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        MatTabsModule,
        MatListModule,
        MatIconModule,
        MatButtonModule,
        MatCardModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        DatePipe
    ],
    templateUrl: './dashboard.html',
    styleUrl: './dashboard.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit {
    private quoteService = inject(QuoteService);
    private auth = inject(AuthService);
    private notify = inject(NotificationService);
    private cdr = inject(ChangeDetectorRef);

    sentQuotes: any[] = [];
    receivedQuotes: any[] = [];
    loading = true;
    userRole: string | null = null;
    userId: string | null = null;

    async ngOnInit() {
        await this.auth.initialized;
        const profile = this.auth.userProfile();
        if (!profile) { this.loading = false; return; }
        this.userRole = profile.role;
        this.userId = profile.id;
        await this.loadQuotes();
    }

    async loadQuotes() {
        if (!this.userId) return;
        this.loading = true;
        try {
            if (this.userRole === 'PERITO') {
                const { data } = await this.quoteService.getReceivedQuotes(this.userId);
                this.receivedQuotes = data ?? [];
            } else {
                const { data } = await this.quoteService.getSentQuotes(this.userId);
                this.sentQuotes = data ?? [];
            }
        } catch {
            this.notify.error('Erro ao carregar cotações.');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'replied': case 'under_review': return 'primary';
            case 'accepted': case 'approved': return 'accent';
            case 'rejected': return 'warn';
            default: return '';
        }
    }

    getStatusLabel(status: string): string {
        switch (status) {
            case 'replied': case 'under_review': return 'Respondido';
            case 'accepted': case 'approved': return 'Aceito';
            case 'rejected': return 'Recusado';
            default: return 'Pendente';
        }
    }
}
