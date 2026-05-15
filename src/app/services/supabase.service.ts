import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        const safeStorage = {
            getItem: (key: string): string | null => {
                try { return localStorage.getItem(key); }
                catch { return null; }
            },
            setItem: (key: string, value: string): void => {
                try { localStorage.setItem(key, value); }
                catch { }
            },
            removeItem: (key: string): void => {
                try { localStorage.removeItem(key); }
                catch { }
            }
        };
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
            auth: { autoRefreshToken: true, detectSessionInUrl: true, persistSession: true, storage: safeStorage }
        });
    }

    get client(): SupabaseClient { return this.supabase; }

    signIn(email: string, password: string) {
        return this.supabase.auth.signInWithPassword({ email, password });
    }

    signUp(email: string, password: string, data: any = {}) {
        return this.supabase.auth.signUp({ email, password, options: { data } });
    }

    signOut() { return this.supabase.auth.signOut(); }
    getUser() { return this.supabase.auth.getUser(); }
    getSession() { return this.supabase.auth.getSession(); }

    getProfile(id: string) {
        return this.supabase.from('profiles').select('*').eq('id', id).single();
    }

    private sanitizeProfileData(data: any) {
        const excluded = [
            'created_at', 'updated_at', 'profile_type', 'account_status',
            'role', 'is_admin', 'permissions', 'email', 'password',
            'user_metadata', 'app_metadata', 'last_sign_in_at', 'confirmed_at',
            'approved_at', 'approved_by'
        ];
        const sanitized = { ...data };
        for (const key of excluded) delete sanitized[key];
        return sanitized;
    }

    updateProfile(id: string, data: any) {
        return this.supabase.from('profiles').update(this.sanitizeProfileData(data)).eq('id', id);
    }

    adminUpdateProfile(id: string, data: any) {
        return this.supabase.from('profiles').update(data).eq('id', id);
    }

    searchExperts(filters: { name?: string; specialty?: string; location?: string; minRating?: number; maxRate?: number; orderBy?: string }) {
        let query = this.supabase.from('profiles').select('*').eq('profile_type', 'PERITO').eq('profile_visible', true).eq('account_status', 'ACTIVE');
        if (filters.name) query = query.or(`first_name.ilike.%${filters.name}%,last_name.ilike.%${filters.name}%`);
        if (filters.specialty) query = query.ilike('specialty', `%${filters.specialty}%`);
        if (filters.location) {
            const loc = `%${filters.location}%`;
            query = query.or(`city.ilike.${loc},state.ilike.${loc}`);
        }
        if (filters.minRating && filters.minRating > 0) query = query.gte('rating', filters.minRating);
        if (filters.maxRate && filters.maxRate > 0) query = query.lte('hourly_rate', filters.maxRate);
        switch (filters.orderBy) {
            case 'hourly_rate_asc': query = query.order('hourly_rate', { ascending: true }); break;
            case 'hourly_rate_desc': query = query.order('hourly_rate', { ascending: false }); break;
            default: query = query.order('rating', { ascending: false });
        }
        return query;
    }

    async getFeaturedExperts(limit = 6) {
        const { data } = await this.supabase.rpc('get_featured_experts', { limit_count: limit });
        if (data) return { data };
        return this.supabase.from('profiles').select('*')
            .eq('profile_type', 'PERITO')
            .eq('profile_visible', true)
            .eq('account_status', 'ACTIVE')
            .order('rating', { ascending: false })
            .limit(limit);
    }

    uploadFile(bucket: string, path: string, file: File) {
        return this.supabase.storage.from(bucket).upload(path, file, { upsert: true });
    }

    getFileUrl(bucket: string, path: string): string {
        if (!path || path.startsWith('http')) return path || '';
        return `${environment.supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
    }

    async getSignedUrl(bucket: string, path: string, expiresIn = 300) {
        if (!path || path.startsWith('http')) return path;
        const { data } = await this.supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
        return data?.signedUrl ?? null;
    }

    createLead(data: { expert_id: string; client_id: string; message: string }) {
        return this.supabase.from('leads').insert({
            expert_id: data.expert_id,
            client_id: data.client_id,
            message: data.message,
        });
    }

    createReview(data: { expert_id: string; client_id: string; rating: number; comment: string; lead_id?: string }) {
        return this.supabase.from('reviews').insert({
            expert_id: data.expert_id,
            client_id: data.client_id,
            rating: data.rating,
            comment: data.comment,
            lead_id: data.lead_id ?? null,
        });
    }

    getLeadsForClient(clientId: string) {
        return this.supabase.from('leads').select('*, expert:expert_id(*)').eq('client_id', clientId).order('created_at', { ascending: false });
    }

    getReviewsForExpert(expertId: string) {
        return this.supabase.from('reviews').select('*').eq('expert_id', expertId).order('created_at', { ascending: false });
    }

    async uploadAvatar(userId: string, file: File): Promise<string> {
        const filePath = `${userId}/avatar_${Date.now()}.${file.name.split('.').pop()}`;
        const { data, error } = await this.supabase.storage
            .from('avatars')
            .upload(filePath, file, {
                upsert: true,
                contentType: file.type,
            });
        if (error) {
            console.error('Storage upload error:', error);
            throw error;
        }
        const { data: { publicUrl } } = this.supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
        return publicUrl;
    }

    async uploadCv(userId: string, file: File): Promise<string> {
        const ext = file.name.split('.').pop();
        const filePath = `${userId}/cv_${Date.now()}.${ext}`;
        const { data, error } = await this.supabase.storage
            .from('curriculums')
            .upload(filePath, file, {
                upsert: true,
                contentType: file.type,
            });
        if (error) {
            console.error('Storage upload error:', error);
            throw error;
        }
        const { data: { publicUrl } } = this.supabase.storage
            .from('curriculums')
            .getPublicUrl(filePath);
        return publicUrl;
    }

    upsertProfile(data: any) {
        return this.supabase.from('profiles').upsert(this.sanitizeProfileData(data), { onConflict: 'id' });
    }

    async sendNotificationEmail(to: string, subject: string, html: string, fromName?: string): Promise<{ success: boolean; error?: string; code?: string }> {
        try {
            const { data, error } = await this.supabase.functions.invoke('send-email', {
                body: { to, subject, html, from_name: fromName }
            });
            
            if (error) {
                console.error('Email notification error:', error);
                return { success: false, error: error.message || 'Erro ao enviar email' };
            }
            
            if (data && !data.success) {
                console.error('Email send failed:', data);
                return { 
                    success: false, 
                    error: data.error || 'Erro ao enviar email',
                    code: data.code || 'UNKNOWN_ERROR'
                };
            }
            
            return { success: true };
        } catch (err: any) {
            console.error('Failed to send email notification:', err);
            return { success: false, error: err.message || 'Erro ao enviar email' };
        }
    }

    submitContact(data: { name: string; email: string; subject: string; message: string }) {
        return this.supabase.from('contact_submissions').insert(data);
    }

    resetPasswordForEmail(email: string) {
        return this.supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    }

    async getAdminStats() {
        const [peritos, contratantes, quotes, visiveis, reviews, leads, pending] = await Promise.allSettled([
            this.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_type', 'PERITO'),
            this.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_type', 'CONTRATANTE'),
            this.supabase.from('quotes').select('*', { count: 'exact', head: true }),
            this.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_type', 'PERITO').eq('profile_visible', true),
            this.supabase.from('reviews').select('*', { count: 'exact', head: true }),
            this.supabase.from('leads').select('*', { count: 'exact', head: true }),
            this.supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_type', 'PERITO').eq('account_status', 'PENDING'),
        ]);

        return {
            peritos: peritos.status === 'fulfilled' ? peritos.value.count ?? 0 : 0,
            contratantes: contratantes.status === 'fulfilled' ? contratantes.value.count ?? 0 : 0,
            quotes: quotes.status === 'fulfilled' ? quotes.value.count ?? 0 : 0,
            visiveis: visiveis.status === 'fulfilled' ? visiveis.value.count ?? 0 : 0,
            reviews: reviews.status === 'fulfilled' ? reviews.value.count ?? 0 : 0,
            leads: leads.status === 'fulfilled' ? leads.value.count ?? 0 : 0,
            pending: pending.status === 'fulfilled' ? pending.value.count ?? 0 : 0,
        };
    }

    async getConversionMetrics() {
        const [quotesResult] = await Promise.allSettled([
            this.supabase.from('quotes').select('status, created_at, responded_at').order('created_at', { ascending: false }),
        ]);

        if (quotesResult.status !== 'fulfilled' || !quotesResult.value.data) {
            return { monthlyQuotes: 0, conversionRate: 0, avgResponseHours: 0, reviewRate: 0 };
        }

        const quotes = quotesResult.value.data;
        const now = new Date();
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        const monthlyQuotes = quotes.filter(q => new Date(q.created_at) >= monthAgo).length;
        const approved = quotes.filter(q => q.status === 'approved').length;
        const conversionRate = quotes.length > 0 ? (approved / quotes.length) * 100 : 0;

        const respondedQuotes = quotes.filter(q => q.responded_at);
        const avgResponseHours = respondedQuotes.length > 0
            ? Math.round(respondedQuotes.reduce((acc, q) => {
                const created = new Date(q.created_at).getTime();
                const responded = new Date(q.responded_at).getTime();
                return acc + (responded - created);
            }, 0) / respondedQuotes.length / (1000 * 60 * 60))
            : 0;

        const [reviewsResult] = await Promise.allSettled([
            this.supabase.from('reviews').select('*', { count: 'exact', head: true }),
        ]);
        const reviewCount = reviewsResult.status === 'fulfilled' ? reviewsResult.value.count ?? 0 : 0;
        const reviewRate = approved > 0 ? (reviewCount / approved) * 100 : 0;

        return { monthlyQuotes, conversionRate: Math.round(conversionRate * 10) / 10, avgResponseHours, reviewRate: Math.round(reviewRate * 10) / 10 };
    }

    async getPendingExperts() {
        return this.supabase.from('profiles').select('*').eq('profile_type', 'PERITO').eq('account_status', 'PENDING').order('updated_at', { ascending: false });
    }

    async approveExpert(expertId: string, adminId: string) {
        return this.supabase.from('profiles').update({
            account_status: 'ACTIVE',
            profile_visible: true,
            approved_at: new Date().toISOString(),
            approved_by: adminId,
        }).eq('id', expertId);
    }

    async rejectExpert(expertId: string) {
        return this.supabase.from('profiles').update({
            account_status: 'BLOCKED',
            profile_visible: false,
        }).eq('id', expertId);
    }
}
