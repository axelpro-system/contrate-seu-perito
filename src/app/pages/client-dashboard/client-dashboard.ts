import { ChangeDetectorRef, Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { QuoteService } from '../../services/quote.service';
import { ReviewDialog } from '../../components/review-dialog/review-dialog';
import { ChatDialog } from '../../components/chat-dialog/chat-dialog';
import { QuoteStatus } from '../../types';

@Component({
    selector: 'app-client-dashboard',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule, RouterLink],
    templateUrl: './client-dashboard.html',
    styleUrl: './client-dashboard.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDashboard implements OnInit {
    private quoteService = inject(QuoteService);
    private auth = inject(AuthService);
    private notify = inject(NotificationService);
    private dialog = inject(MatDialog);
    private cdr = inject(ChangeDetectorRef);
    protected readonly QuoteStatus = QuoteStatus;
    quotes: any[] = [];
    loading = true;
    acting: string | null = null;

    ngOnInit() {
        setTimeout(() => this.loadQuotes(), 0);
    }

    private async loadQuotes() {
        await this.auth.initialized;
        const profile = this.auth.userProfile();
        if (!profile) { this.loading = false; this.cdr.detectChanges(); return; }
        try {
            const { data } = await this.quoteService.getSentQuotes(profile.id);
            const enriched = await this.quoteService.enrichQuotesWithExpertNames(data ?? []);
            this.quotes = enriched;
        } catch {
            this.notify.error('Erro ao carregar cotações.');
        } finally {
            this.loading = false;
            this.cdr.detectChanges();
        }
    }

    async accept(q: any) {
        this.acting = q.id;
        try {
            await this.quoteService.acceptQuote(q.id);
            q.status = 'approved';
            this.notify.success('Proposta aceita!');
        } catch {
            this.notify.error('Erro ao aceitar.');
        } finally {
            this.acting = null;
            this.cdr.detectChanges();
        }
    }

    async reject(q: any) {
        this.acting = q.id;
        try {
            await this.quoteService.rejectQuote(q.id);
            q.status = 'rejected';
            this.notify.success('Proposta recusada.');
        } catch {
            this.notify.error('Erro ao recusar.');
        } finally {
            this.acting = null;
            this.cdr.detectChanges();
        }
    }

    openChat(q: any) {
        const expertName = q.expert?.full_name || `${q.expert?.first_name || ''} ${q.expert?.last_name || ''}`.trim() || 'Perito';
        this.dialog.open(ChatDialog, {
            width: '460px',
            data: {
                quoteId: q.id,
                otherName: expertName,
                expertId: q.expert_id,
                requesterId: q.requester_id,
            }
        });
    }

    openReview(q: any) {
        const expertName = q.expert?.full_name || `${q.expert?.first_name || ''} ${q.expert?.last_name || ''}`.trim() || 'Perito';
        const dialogRef = this.dialog.open(ReviewDialog, {
            width: '500px',
            data: { expertId: q.expert_id, expertName, clientId: this.auth.userProfile()?.id }
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result) this.notify.success('Avaliação enviada!');
        });
    }
}
