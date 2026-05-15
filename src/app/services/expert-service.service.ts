import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ExpertService {
    id: string;
    expert_id: string;
    service_name: string;
    description: string | null;
    base_price: number | null;
    price_unit: 'hour' | 'report' | 'consultation' | 'document' | 'analysis' | 'fixed';
    currency: string;
    is_active: boolean;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export const PRICE_UNIT_LABELS: Record<string, string> = {
    hour: 'por hora',
    report: 'por laudo',
    consultation: 'por consulta',
    document: 'por documento',
    analysis: 'por análise',
    fixed: 'preço fixo',
};

@Injectable({ providedIn: 'root' })
export class ExpertServiceService {
    private supabase = inject(SupabaseService);
    items = signal<ExpertService[]>([]);
    loading = signal(false);

    async load(expertId: string) {
        this.loading.set(true);
        const { data } = await this.supabase.client
            .from('expert_services')
            .select('*')
            .eq('expert_id', expertId)
            .eq('is_active', true)
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });
        this.items.set(data ?? []);
        this.loading.set(false);
    }

    async addService(expertId: string, service: Partial<ExpertService>) {
        const { error } = await this.supabase.client.from('expert_services').insert({
            expert_id: expertId,
            service_name: service.service_name,
            description: service.description,
            base_price: service.base_price,
            price_unit: service.price_unit ?? 'hour',
            currency: service.currency ?? 'BRL',
            display_order: service.display_order ?? 0,
        });
        if (error) throw error;
        await this.load(expertId);
    }

    async updateService(serviceId: string, expertId: string, updates: Partial<ExpertService>) {
        const { error } = await this.supabase.client
            .from('expert_services')
            .update({
                service_name: updates.service_name,
                description: updates.description,
                base_price: updates.base_price,
                price_unit: updates.price_unit,
                currency: updates.currency,
                is_active: updates.is_active,
                display_order: updates.display_order,
            })
            .eq('id', serviceId);
        if (error) throw error;
        await this.load(expertId);
    }

    async removeService(serviceId: string, expertId: string) {
        const { error } = await this.supabase.client
            .from('expert_services')
            .delete()
            .eq('id', serviceId);
        if (error) throw error;
        this.items.update(list => list.filter(i => i.id !== serviceId));
    }

    async toggleActive(serviceId: string, expertId: string, active: boolean) {
        await this.updateService(serviceId, expertId, { is_active: active });
    }

    // Admin: verify/unverify expert
    async setVerified(expertId: string, verified: boolean) {
        const { error } = await this.supabase.client
            .from('profiles')
            .update({ is_verified: verified })
            .eq('id', expertId);
        if (error) throw error;
    }

    // Admin: feature/unfeature expert
    async setFeatured(expertId: string, featured: boolean) {
        const { error } = await this.supabase.client
            .from('profiles')
            .update({ is_featured: featured })
            .eq('id', expertId);
        if (error) throw error;
    }
}
