import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { QuoteStatus } from '../types';

export interface QuotePayload {
    expertId: string;
    requesterId?: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone?: string;
    caseDescription: string;
}

export interface QuoteResponse {
    proposedValue: number;
    deadline: string;
    notes: string;
}

@Injectable({ providedIn: 'root' })
export class QuoteService {
    private supabase = inject(SupabaseService);

    async createQuote(quote: QuotePayload) {
        return this.supabase.client.from('quotes').insert({
            expert_id: quote.expertId,
            requester_id: quote.requesterId ?? null,
            requester_name: quote.requesterName,
            requester_email: quote.requesterEmail,
            requester_phone: quote.requesterPhone ?? null,
            case_description: quote.caseDescription,
        });
    }

    async getSentQuotes(userId: string) {
        return this.supabase.client
            .from('quotes')
            .select('*')
            .eq('requester_id', userId)
            .order('created_at', { ascending: false });
    }

    async getReceivedQuotes(userId: string) {
        return this.supabase.client
            .from('quotes')
            .select('*')
            .eq('expert_id', userId)
            .order('created_at', { ascending: false });
    }

    async enrichQuotesWithExpertNames(quotes: any[]): Promise<any[]> {
        if (!quotes || quotes.length === 0) return [];
        const expertIds = [...new Set(quotes.map(q => q.expert_id).filter(Boolean))];
        if (expertIds.length === 0) return quotes;

        const { data: experts } = await this.supabase.client
            .from('profiles')
            .select('id, first_name, last_name, full_name')
            .in('id', expertIds);

        const expertMap = new Map((experts || []).map(e => [e.id, e]));
        return quotes.map(q => {
            const expert = expertMap.get(q.expert_id);
            return { ...q, expert };
        });
    }

    async enrichQuotesWithRequesterNames(quotes: any[]): Promise<any[]> {
        if (!quotes || quotes.length === 0) return [];
        const requesterIds = [...new Set(quotes.map(q => q.requester_id).filter(Boolean))];
        if (requesterIds.length === 0) return quotes;

        const { data: requesters } = await this.supabase.client
            .from('profiles')
            .select('id, first_name, last_name, full_name')
            .in('id', requesterIds);

        const requesterMap = new Map((requesters || []).map(r => [r.id, r]));
        return quotes.map(q => {
            const requester = requesterMap.get(q.requester_id);
            return { ...q, requester };
        });
    }

    async respondToQuote(quoteId: string, response: QuoteResponse) {
        return this.supabase.client.from('quotes').update({
            proposed_value: response.proposedValue,
            proposed_deadline: response.deadline,
            expert_notes: response.notes,
            responded_at: new Date().toISOString(),
            status: QuoteStatus.UNDER_REVIEW,
        }).eq('id', quoteId);
    }

    async acceptQuote(quoteId: string) {
        return this.supabase.client.from('quotes').update({ status: QuoteStatus.APPROVED }).eq('id', quoteId);
    }

    async rejectQuote(quoteId: string) {
        return this.supabase.client.from('quotes').update({ status: QuoteStatus.REJECTED }).eq('id', quoteId);
    }

    async getQuoteById(quoteId: string) {
        return this.supabase.client.from('quotes').select('*').eq('id', quoteId).single();
    }

    async getQuoteStats(userId: string, role: 'requester' | 'expert') {
        const column = role === 'requester' ? 'requester_id' : 'expert_id';
        const { data } = await this.supabase.client
            .from('quotes')
            .select('status, created_at, responded_at')
            .eq(column, userId);

        if (!data) return { total: 0, pending: 0, underReview: 0, approved: 0, rejected: 0, avgResponseTime: 0 };

        const avgResponseTime = data
            .filter(q => q.responded_at)
            .reduce((acc, q) => {
                const created = new Date(q.created_at).getTime();
                const responded = new Date(q.responded_at).getTime();
                return acc + (responded - created);
            }, 0) / (data.filter(q => q.responded_at).length || 1);

        return {
            total: data.length,
            pending: data.filter(q => q.status === QuoteStatus.SUBMITTED).length,
            underReview: data.filter(q => q.status === QuoteStatus.UNDER_REVIEW).length,
            approved: data.filter(q => q.status === QuoteStatus.APPROVED).length,
            rejected: data.filter(q => q.status === QuoteStatus.REJECTED).length,
            avgResponseTime: Math.round(avgResponseTime / (1000 * 60 * 60)),
        };
    }
}
