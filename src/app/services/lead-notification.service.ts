import { Injectable, OnDestroy, signal, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

@Injectable({ providedIn: 'root' })
export class LeadNotificationService implements OnDestroy {
    private supabase = inject(SupabaseService);
    private auth = inject(AuthService);
    private notify = inject(NotificationService);
    unreadCount = signal(0);
    private channel: any = null;

    async startListening() {
        await this.auth.initialized;
        const profile = this.auth.userProfile();
        if (!profile || profile.role !== 'PERITO') return;

        this.channel = this.supabase.client.channel('quotes')
            .on('postgres_changes' as any, { event: 'INSERT', schema: 'public', table: 'quotes', filter: `expert_id=eq.${profile.id}` },
                (payload: any) => {
                    const row = payload.new as any;
                    this.unreadCount.update(c => c + 1);
                    this.notify.info(`Nova cotação recebida de ${row.requester_name || 'contratante'}!`, 6000);
                })
            .on('postgres_changes' as any, { event: 'UPDATE', schema: 'public', table: 'quotes', filter: `expert_id=eq.${profile.id}` },
                (payload: any) => {
                    const row = payload.new as any;
                    const prev = payload.old as any;
                    if (prev.status === 'under_review' && row.status === 'approved') {
                        this.notify.success('Proposta aceita! O cliente aprovou seu orçamento.', 6000);
                    } else if (prev.status === 'under_review' && row.status === 'rejected') {
                        this.notify.info('Proposta recusada. O cliente recusou seu orçamento.', 6000);
                    }
                })
            .subscribe();
    }

    stopListening() {
        if (this.channel) { this.supabase.client.removeChannel(this.channel); this.channel = null; }
    }

    markAllRead() { this.unreadCount.set(0); }
    ngOnDestroy() { this.stopListening(); }
}
