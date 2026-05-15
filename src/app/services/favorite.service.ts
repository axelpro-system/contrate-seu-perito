import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FavoriteService {
    private supabase = inject(SupabaseService);
    private auth = inject(AuthService);
    favoriteIds = signal<Set<string>>(new Set());

    async loadFavorites() {
        await this.auth.initialized;
        const user = this.auth.userProfile();
        if (!user || user.role !== 'CONTRATANTE') return;

        const { data } = await this.supabase.client
            .from('favorites')
            .select('expert_id')
            .eq('client_id', user.id);

        if (data) {
            this.favoriteIds.set(new Set(data.map(f => f.expert_id)));
        }
    }

    async toggle(expertId: string) {
        const user = this.auth.userProfile();
        if (!user) return;

        const current = this.favoriteIds();
        if (current.has(expertId)) {
            await this.supabase.client
                .from('favorites')
                .delete()
                .eq('client_id', user.id)
                .eq('expert_id', expertId);
            current.delete(expertId);
        } else {
            await this.supabase.client
                .from('favorites')
                .insert({ client_id: user.id, expert_id: expertId });
            current.add(expertId);
        }
        this.favoriteIds.set(new Set(current));
    }

    isFavorite(expertId: string): boolean {
        return this.favoriteIds().has(expertId);
    }
}
