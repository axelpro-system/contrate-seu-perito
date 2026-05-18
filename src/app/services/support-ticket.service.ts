import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import type { SupportTicket, TicketMessage, TicketPriority } from '../types';

@Injectable({ providedIn: 'root' })
export class SupportTicketService {
    private supabase = inject(SupabaseService);
    tickets = signal<SupportTicket[]>([]);
    loading = signal(false);

    async loadMyTickets(userId: string) {
        this.loading.set(true);
        const { data } = await this.supabase.client
            .from('support_tickets')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        this.tickets.set(data ?? []);
        this.loading.set(false);
    }

    async loadAllTickets() {
        this.loading.set(true);
        const { data } = await this.supabase.client
            .from('support_tickets')
            .select('*, user:user_id(full_name, email)')
            .order('created_at', { ascending: false });
        this.tickets.set(data ?? []);
        this.loading.set(false);
    }

    async create(userId: string, subject: string, description: string, priority: TicketPriority = 'medium') {
        const { data, error } = await this.supabase.client
            .from('support_tickets')
            .insert({ user_id: userId, subject, description, priority })
            .select()
            .single();
        if (error) throw error;
        this.tickets.update(list => [data, ...list]);
        return data as SupportTicket;
    }

    async updateStatus(ticketId: string, status: string) {
        const { error } = await this.supabase.client
            .from('support_tickets')
            .update({ status })
            .eq('id', ticketId);
        if (error) throw error;
        this.tickets.update(list => list.map(t => t.id === ticketId ? { ...t, status: status as any } : t));
    }

    async assign(ticketId: string, adminId: string) {
        const { error } = await this.supabase.client
            .from('support_tickets')
            .update({ assigned_to: adminId, status: 'in_progress' })
            .eq('id', ticketId);
        if (error) throw error;
    }

    async getMessages(ticketId: string) {
        const { data, error } = await this.supabase.client
            .from('ticket_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        if (error) {
            console.error('getMessages error:', JSON.stringify(error));
            throw error;
        }
        return (data ?? []) as any[];
    }

    async sendMessage(ticketId: string, senderId: string, message: string, isInternal = false) {
        const { data, error } = await this.supabase.client
            .from('ticket_messages')
            .insert({ ticket_id: ticketId, sender_id: senderId, message, is_internal: isInternal })
            .select();
        if (error) {
            console.error('sendMessage error:', error);
            throw error;
        }
    }

    async getTicketById(ticketId: string) {
        const { data } = await this.supabase.client
            .from('support_tickets')
            .select('*, user:user_id(full_name, email)')
            .eq('id', ticketId)
            .single();
        return data as any;
    }
}
