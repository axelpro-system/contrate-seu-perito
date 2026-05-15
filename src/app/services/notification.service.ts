import { Injectable, OnDestroy, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface AppNotification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string | null;
    data: any;
    read: boolean;
    created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService implements OnDestroy {
    private supabase = inject(SupabaseService);
    private auth = inject(AuthService);
    private snackBar = inject(MatSnackBar);

    notifications = signal<AppNotification[]>([]);
    unreadCount = signal(0);
    private channel: any = null;

    success(message: string, duration = 3000) {
        this.snackBar.open(message, 'Fechar', { duration, panelClass: 'snackbar-success' });
    }

    error(message: string, duration = 5000) {
        this.snackBar.open(message, 'Fechar', { duration, panelClass: 'snackbar-error' });
    }

    info(message: string, duration = 3000) {
        this.snackBar.open(message, 'Fechar', { duration, panelClass: 'snackbar-info' });
    }

    async loadNotifications() {
        await this.auth.initialized;
        const user = this.auth.userProfile();
        if (!user) return;

        const { data } = await this.supabase.client
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

        if (data) {
            this.notifications.set(data);
            this.unreadCount.set(data.filter(n => !n.read).length);
        }
    }

    subscribe() {
        if (this.channel) return;

        this.auth.initialized.then(() => {
            const user = this.auth.userProfile();
            if (!user) return;

            this.channel = this.supabase.client.channel('notifications')
                .on('postgres_changes' as any,
                    { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                    (payload: any) => {
                        const n = payload.new as AppNotification;
                        this.notifications.update(list => [n, ...list]);
                        this.unreadCount.update(c => c + 1);
                    })
                .on('postgres_changes' as any,
                    { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
                    (payload: any) => {
                        const updated = payload.new as AppNotification;
                        this.notifications.update(list =>
                            list.map(n => n.id === updated.id ? updated : n)
                        );
                        this.unreadCount.update(() =>
                            this.notifications().filter(n => !n.read).length
                        );
                    })
                .subscribe();
        });
    }

    async markAsRead(notificationId: string) {
        await this.supabase.client
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);
    }

    async markAllAsRead() {
        const user = this.auth.userProfile();
        if (!user) return;
        await this.supabase.client
            .from('notifications')
            .update({ read: true })
            .eq('user_id', user.id)
            .eq('read', false);
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
        this.unreadCount.set(0);
    }

    async createNotification(userId: string, type: string, title: string, body?: string, data?: any) {
        await this.supabase.client
            .from('notifications')
            .insert({ user_id: userId, type, title, body, data });
    }

    ngOnDestroy() {
        if (this.channel) {
            this.supabase.client.removeChannel(this.channel);
        }
    }
}
