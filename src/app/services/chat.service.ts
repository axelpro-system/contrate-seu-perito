import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

export interface Message {
    id: string;
    quote_id: string;
    sender_id: string;
    content: string;
    read: boolean;
    created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
    private supabase = inject(SupabaseService);
    private auth = inject(AuthService);
    messages = signal<Message[]>([]);
    loading = signal(false);
    private channel: any = null;

    async loadMessages(quoteId: string) {
        this.loading.set(true);
        const { data } = await this.supabase.client
            .from('messages')
            .select('*')
            .eq('quote_id', quoteId)
            .order('created_at', { ascending: true });
        this.messages.set(data || []);
        this.loading.set(false);
    }

    async sendMessage(quoteId: string, content: string) {
        const user = (await this.supabase.getUser()).data.user;
        if (!user || !content.trim()) return;
        await this.supabase.client.from('messages').insert({
            quote_id: quoteId,
            sender_id: user.id,
            content: content.trim(),
        });
    }

    subscribeToMessages(quoteId: string) {
        if (this.channel) this.supabase.client.removeChannel(this.channel);
        this.channel = this.supabase.client.channel(`chat-${quoteId}`)
            .on('postgres_changes' as any,
                { event: 'INSERT', schema: 'public', table: 'messages', filter: `quote_id=eq.${quoteId}` },
                (payload: any) => {
                    this.messages.update(msgs => [...msgs, payload.new as Message]);
                })
            .subscribe();
    }

    async markAsRead(quoteId: string) {
        const profile = this.auth.userProfile();
        if (!profile) return;
        await this.supabase.client
            .from('messages')
            .update({ read: true })
            .eq('quote_id', quoteId)
            .neq('sender_id', profile.id)
            .eq('read', false);
    }

    stopListening() { this.unsubscribe(); }

    conversations = signal<any[]>([]);

    async loadConversations() {
        const profile = this.auth.userProfile();
        if (!profile) return;
        const { data: quotes } = await this.supabase.client
            .from('quotes')
            .select('id, requester_name, expert:expert_id(first_name, last_name)')
            .or(`expert_id.eq.${profile.id},requester_id.eq.${profile.id}`)
            .in('status', ['approved', 'under_review'])
            .order('updated_at', { ascending: false });
        if (!quotes) return;
        this.conversations.set(quotes.map((q: any) => ({
            quoteId: q.id,
            expertName: q.expert ? `${q.expert.first_name || ''} ${q.expert.last_name || ''}`.trim() : 'Perito',
            clientName: q.requester_name || 'Cliente',
            lastMessage: '',
            unread: 0,
        })));
    }

    unsubscribe() {
        if (this.channel) { this.supabase.client.removeChannel(this.channel); this.channel = null; }
    }
}
