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

    async signUp(email: string, password: string, metadata: any = {}) {
        const { data, error } = await this.supabase.auth.signUp({
            email,
            password,
            options: { data: metadata }
        });

        if (error) {
            console.error('Auth signUp error:', error);
            return { data, error };
        }

        // Fallback: cria perfil manualmente caso o trigger do banco falhe
        const userId = data?.user?.id;
        if (userId) {
            try {
                const { error: profileError } = await this.supabase
                    .from('profiles')
                    .upsert({
                        id: userId,
                        contact_email: email,
                        first_name: metadata.full_name?.split(' ')[0] || '',
                        last_name: metadata.full_name?.split(' ').slice(1).join(' ') || '',
                        full_name: metadata.full_name || null,
                        profile_type: metadata.profile_type || 'CONTRATANTE',
                        profile_visible: metadata.profile_visible ?? false,
                        account_status: 'PENDING',
                    }, { onConflict: 'id' });

                if (profileError) {
                    console.error('Profile creation fallback error:', profileError);
                }
            } catch (profileErr) {
                console.error('Unexpected profile creation error:', profileErr);
            }
        }

        return { data, error };
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
        
        if (filters.specialty) {
            const specLower = filters.specialty.toLowerCase().trim();
            if (specLower === 'contabilidade') {
                query = query.or(
                    'specialty.ilike.%contabilidade%,' +
                    'specialty.ilike.%contador%,' +
                    'specialty.ilike.%contabil%,' +
                    'specialty.ilike.%bancaria%,' +
                    'specialty.ilike.%economista%,' +
                    'specialty.ilike.%tributaria%,' +
                    'specialty.ilike.%haveres%,' +
                    'specialty.ilike.%lucros%,' +
                    'specialty.ilike.%expurgos%,' +
                    'specialty.ilike.%trabalhista%,' +
                    'specialty.ilike.%trabalho%,' +
                    'tags.cs.{"contabilidade"},' +
                    'tags.cs.{"contador"},' +
                    'tags.cs.{"bancária"},' +
                    'tags.cs.{"tributária"},' +
                    'tags.cs.{"trabalhista"}'
                );
            } else if (specLower === 'medicina' || specLower === 'medicina do trabalho' || specLower === 'perícia médica') {
                query = query.or(
                    'specialty.ilike.%medicina%,' +
                    'specialty.ilike.%medico%,' +
                    'specialty.ilike.%medica%,' +
                    'specialty.ilike.%saude%,' +
                    'specialty.ilike.%ortopedia%,' +
                    'specialty.ilike.%psiquiatria%,' +
                    'tags.cs.{"medicina"},' +
                    'tags.cs.{"médico"},' +
                    'tags.cs.{"saúde"}'
                );
            } else if (specLower === 'engenharia civil') {
                query = query.or(
                    'specialty.ilike.%civil%,' +
                    'specialty.ilike.%engenheiro%,' +
                    'specialty.ilike.%engenharia%,' +
                    'specialty.ilike.%estrutural%,' +
                    'specialty.ilike.%patologia%,' +
                    'tags.cs.{"engenharia"},' +
                    'tags.cs.{"civil"},' +
                    'tags.cs.{"engenheiro"}'
                );
            } else if (specLower === 'grafotécnica') {
                query = query.or(
                    'specialty.ilike.%grafotecnica%,' +
                    'specialty.ilike.%grafotecnico%,' +
                    'specialty.ilike.%documentoscopia%,' +
                    'specialty.ilike.%caligrafia%,' +
                    'specialty.ilike.%escrita%,' +
                    'tags.cs.{"grafotécnica"},' +
                    'tags.cs.{"grafotécnico"}'
                );
            } else if (specLower === 'ambiental' || specLower === 'perícia ambiental') {
                query = query.or(
                    'specialty.ilike.%ambiental%,' +
                    'specialty.ilike.%meio ambiente%,' +
                    'specialty.ilike.%biologo%,' +
                    'specialty.ilike.%agronomo%,' +
                    'specialty.ilike.%agronomia%,' +
                    'specialty.ilike.%florestal%,' +
                    'tags.cs.{"ambiental"},' +
                    'tags.cs.{"meio ambiente"}'
                );
            } else {
                const spec = `%${filters.specialty}%`;
                query = query.or(`specialty.ilike.${spec},tags.cs.{"${filters.specialty}"}`);
            }
        }
        
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

    async createReview(data: { expert_id: string; client_id: string; rating: number; comment: string; lead_id?: string }) {
        let reviewerName = 'Cliente';
        try {
            const { data: profile } = await this.getProfile(data.client_id);
            if (profile) {
                reviewerName = profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Cliente';
            }
        } catch (err) {
            console.error('Error fetching reviewer name:', err);
        }

        return this.supabase.from('reviews').insert({
            expert_id: data.expert_id,
            client_id: data.client_id,
            rating: data.rating,
            comment: data.comment,
            lead_id: data.lead_id ?? null,
            reviewer_name: reviewerName
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

    getActiveExpertsForCounts() {
        return this.supabase.from('profiles')
            .select('specialty, tags, city, state')
            .eq('profile_type', 'PERITO')
            .eq('profile_visible', true)
            .eq('account_status', 'ACTIVE');
    }

    async sendNotificationEmail(to: string, subject: string, html: string, fromName?: string): Promise<{ success: boolean; error?: string; code?: string }> {
        try {
            const { data, error } = await this.supabase.functions.invoke('send-email', {
                body: { to, subject, html, from_name: fromName }
            });
            
            if (error) {
                console.error('Email notification error:', error);
                let errMsg = error.message || 'Erro ao enviar email';
                try {
                    const body = await (error as any).context?.json?.();
                    if (body?.error) errMsg = body.error;
                } catch {}
                return { success: false, error: errMsg };
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

    // Check if email exists in auth.users
    async checkEmailExists(email: string): Promise<boolean> {
        try {
            const { data, error } = await this.supabase
                .from('profiles')
                .select('id')
                .eq('email', email)
                .maybeSingle();
            
            if (error) {
                console.error('Error checking email:', error);
                return false;
            }
            
            return !!data;
        } catch (err) {
            console.error('Exception checking email:', err);
            return false;
        }
    }

    // List all auth users (admin only)
    async listAuthUsers(): Promise<{ success: boolean; users?: any[]; error?: string }> {
        try {
            const { data, error } = await this.supabase.functions.invoke('list-users', {
                body: {}
            });
            
            if (error) {
                console.error('List users error:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, users: data.users };
        } catch (err: any) {
            console.error('Exception listing users:', err);
            return { success: false, error: err.message };
        }
    }

    // Delete user by ID (admin only)
    async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
        try {
            const { data, error } = await this.supabase.functions.invoke('delete-user', {
                body: { userId }
            });
            
            if (error) {
                console.error('Delete user error:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true };
        } catch (err: any) {
            console.error('Exception deleting user:', err);
            return { success: false, error: err.message };
        }
    }

    // ============================================
    // EXPERT REGISTRATION LOGS
    // ============================================

    // Get registration logs for an expert
    async getExpertRegistrationLogs(expertId: string) {
        return this.supabase
            .from('expert_registration_logs')
            .select(`
                *,
                changed_by:changed_by(id, first_name, last_name, full_name)
            `)
            .eq('expert_id', expertId)
            .order('created_at', { ascending: false });
    }

    // Submit expert registration (update status to 'submitted')
    async submitExpertRegistration(expertId: string) {
        return this.supabase
            .from('profiles')
            .update({
                registration_status: 'submitted',
                registration_submitted_at: new Date().toISOString(),
                account_status: 'PENDING',
                updated_at: new Date().toISOString()
            })
            .eq('id', expertId)
            .eq('profile_type', 'PERITO');
    }

    // Review expert registration (admin only)
    async reviewExpertRegistration(
        expertId: string, 
        approved: boolean, 
        reason?: string
    ) {
        try {
            const { data, error } = await this.supabase.rpc('review_expert_registration', {
                p_expert_id: expertId,
                p_approved: approved,
                p_reason: reason || null
            });

            if (error) throw error;
            return { success: true, data };
        } catch (err: any) {
            console.error('Error reviewing expert registration:', err);
            return { success: false, error: err.message };
        }
    }

    // Get pending registrations (admin view)
    async getPendingRegistrations() {
        return this.supabase
            .from('pending_registrations_view')
            .select('*');
    }

    // Get expert registration status
    async getExpertRegistrationStatus(expertId: string) {
        return this.supabase
            .from('profiles')
            .select('registration_status, registration_submitted_at, registration_reviewed_at, registration_reviewed_by, registration_rejection_reason')
            .eq('id', expertId)
            .single();
    }

    // Update registration notes
    async updateRegistrationNotes(expertId: string, notes: string) {
        return this.supabase
            .from('profiles')
            .update({
                registration_notes: notes,
                updated_at: new Date().toISOString()
            })
            .eq('id', expertId);
    }

    // Send status update notification email to expert
    async sendStatusUpdateNotification(
        expertId: string,
        oldStatus: string,
        newStatus: string,
        reason?: string
    ): Promise<{ success: boolean; emailSent?: boolean; error?: string }> {
        try {
            const { data, error } = await this.supabase.functions.invoke('send-status-update', {
                body: {
                    expertId,
                    oldStatus,
                    newStatus,
                    reason,
                    sendEmail: true
                }
            });

            if (error) {
                console.error('Error sending status update notification:', error);
                return { success: false, error: error.message };
            }

            return {
                success: true,
                emailSent: data?.emailSent || false
            };
        } catch (err: any) {
            console.error('Exception sending status update notification:', err);
            return { success: false, error: err.message };
        }
    }

    // Get latest registration change for notification
    async getLatestRegistrationChange(expertId: string) {
        try {
            const { data, error } = await this.supabase.rpc('get_latest_registration_change', {
                p_expert_id: expertId
            });

            if (error) throw error;
            return { success: true, data };
        } catch (err: any) {
            console.error('Error getting latest registration change:', err);
            return { success: false, error: err.message };
        }
    }
}
