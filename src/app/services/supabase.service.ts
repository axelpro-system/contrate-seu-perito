import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    get client(): SupabaseClient {
        return this.supabase;
    }

    signIn(email: string, password: string) {
        return this.supabase.auth.signInWithPassword({
            email,
            password,
        });
    }

    signUp(email: string, password: string, data: any = {}) {
        return this.supabase.auth.signUp({
            email,
            password,
            options: {
                data,
            },
        });
    }

    signOut() {
        return this.supabase.auth.signOut();
    }

    getUser() {
        return this.supabase.auth.getUser();
    }

    getSession() {
        return this.supabase.auth.getSession();
    }

    getProfile(id: string) {
        return this.supabase
            .from('profiles')
            .select('*')
            .eq('id', id)
            .single();
    }

    updateProfile(id: string, data: any) {
        return this.supabase
            .from('profiles')
            .update(data)
            .eq('id', id);
    }

    searchExperts(filters: { name?: string; specialty?: string; city?: string }) {
        let query = this.supabase
            .from('profiles')
            .select('*')
            .eq('role', 'expert');

        if (filters.name) {
            query = query.ilike('full_name', `%${filters.name}%`);
        }
        if (filters.specialty) {
            query = query.ilike('specialty', `%${filters.specialty}%`);
        }
        if (filters.city) {
            query = query.ilike('city', `%${filters.city}%`);
        }

        return query;
    }

    resetPasswordForEmail(email: string) {
        return this.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/update-password`,
        });
    }
}
