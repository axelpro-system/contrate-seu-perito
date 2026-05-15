import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface PortfolioItem {
    id: string;
    expert_id: string;
    title: string;
    description: string | null;
    file_url: string | null;
    file_type: string | null;
    created_at: string;
}

@Injectable({ providedIn: 'root' })
export class PortfolioService {
    private supabase = inject(SupabaseService);
    items = signal<PortfolioItem[]>([]);
    loading = signal(false);

    async load(expertId: string) {
        this.loading.set(true);
        const { data } = await this.supabase.client
            .from('portfolio_items')
            .select('*')
            .eq('expert_id', expertId)
            .order('created_at', { ascending: false });
        this.items.set(data ?? []);
        this.loading.set(false);
    }

    async addItem(expertId: string, title: string, description: string, file?: File) {
        let file_url: string | null = null;
        let file_type: string | null = null;

        if (file) {
            const path = `portfolio/${expertId}/${Date.now()}_${file.name}`;
            const { error: uploadError } = await this.supabase.client.storage
                .from('portfolio')
                .upload(path, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = this.supabase.client.storage
                .from('portfolio')
                .getPublicUrl(path);
            file_url = publicUrl;
            file_type = file.type;
        }

        await this.supabase.client.from('portfolio_items').insert({
            expert_id: expertId, title, description, file_url, file_type,
        });
        await this.load(expertId);
    }

    async removeItem(itemId: string) {
        await this.supabase.client.from('portfolio_items').delete().eq('id', itemId);
        this.items.update(list => list.filter(i => i.id !== itemId));
    }
}
