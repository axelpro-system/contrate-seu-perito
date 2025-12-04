import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Router } from '@angular/router';

export interface UserProfile {
    id: string;
    full_name: string;
    role: 'client' | 'expert';
    email: string;
    // Add other profile fields as needed
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Signals to track authentication state and user profile
    public isAuthenticated = signal(false);
    public userProfile = signal<UserProfile | null>(null);
    public isLoading = signal(true);

    constructor(
        private supabaseService: SupabaseService,
        private router: Router
    ) {
        this.initializeSession();
    }

    private async initializeSession() {
        try {
            const { data: { session } } = await this.supabaseService.getSession();

            if (session) {
                this.isAuthenticated.set(true);
                await this.loadUserProfile(session.user.id);
            } else {
                this.isAuthenticated.set(false);
                this.userProfile.set(null);
            }
        } catch (error) {
            console.error('Error initializing session:', error);
            this.isAuthenticated.set(false);
            this.userProfile.set(null);
        } finally {
            this.isLoading.set(false);
        }

        // Listen for auth state changes (e.g., login, logout, token refresh)
        this.supabaseService.client.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                this.isAuthenticated.set(true);
                this.loadUserProfile(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                this.isAuthenticated.set(false);
                this.userProfile.set(null);
                this.router.navigate(['/login']);
            }
        });
    }

    private async loadUserProfile(userId: string) {
        try {
            const { data: profile, error } = await this.supabaseService.getProfile(userId);
            if (error) throw error;

            if (profile) {
                this.userProfile.set({
                    id: profile.id,
                    full_name: profile.full_name,
                    role: profile.role,
                    email: profile.email || '', // Assuming email is available or fetched
                });
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            // Handle case where profile might not exist yet (e.g., after initial sign up before trigger runs)
        }
    }

    async logout() {
        await this.supabaseService.signOut();
        // The onAuthStateChange listener handles state update and navigation
    }
}