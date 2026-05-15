import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

export interface UserProfile {
    id: string;
    first_name: string;
    last_name: string;
    role: string;
    contact_email: string;
    accountStatus?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
    public authenticated = signal(false);
    public userProfile = signal<UserProfile | null>(null);
    public isLoading = signal(true);
    private initializationPromise: Promise<void>;

    constructor(private supabaseService: SupabaseService, private router: Router) {
        this.initializationPromise = this.initializeSession();
        this.supabaseService.client.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.authenticated.set(true);
                this.loadUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                this.authenticated.set(false);
                this.userProfile.set(null);
                this.router.navigate(['/login']);
            }
        });
    }

    get initialized(): Promise<void> { return this.initializationPromise; }
    isAuthenticated(): boolean { return this.authenticated(); }

    async awaitProfile(): Promise<UserProfile> {
        return new Promise((resolve) => {
            const check = () => {
                const profile = this.userProfile();
                if (profile) resolve(profile);
                else setTimeout(check, 50);
            };
            check();
        });
    }

    private async initializeSession() {
        try {
            const { data: { session } } = await this.supabaseService.getSession();
            if (session) {
                this.authenticated.set(true);
                await this.loadUserProfile(session.user.id);
            } else {
                this.authenticated.set(false);
                this.userProfile.set(null);
            }
        } catch (error) {
            console.error('Error initializing session:', error);
            this.authenticated.set(false);
            this.userProfile.set(null);
        } finally {
            this.isLoading.set(false);
        }
    }

    private async loadUserProfile(userId: string) {
        try {
            const { data: profile, error } = await this.supabaseService.getProfile(userId);
            if (error) throw error;
            if (profile) {
                this.userProfile.set({
                    id: profile.id,
                    first_name: profile.first_name || '',
                    last_name: profile.last_name || '',
                    role: profile.profile_type || 'CONTRATANTE',
                    contact_email: profile.contact_email || '',
                    accountStatus: profile.account_status || 'PENDING',
                });
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
        }
    }

    getRedirectUrl(): string {
        const profile = this.userProfile();
        if (!profile) return '/login';

        if (profile.role === 'ADMIN') return '/admin';
        if (profile.role === 'PERITO') {
            if (profile.accountStatus === 'PENDING') return '/expert/onboarding';
            return '/expert-dashboard';
        }
        return '/search';
    }

    async logout() { await this.supabaseService.signOut(); }
}
