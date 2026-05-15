import { inject, OnInit, OnDestroy, Directive } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { SupabaseService } from '../services/supabase.service';
import { Subject } from 'rxjs';

@Directive()
export abstract class BaseAdminComponent implements OnInit, OnDestroy {
    protected supabase = inject(SupabaseService);
    protected router = inject(Router);
    protected notify = inject(NotificationService);
    protected destroy$ = new Subject<void>();

    loading = false;
    error: string | null = null;

    abstract ngOnInit(): void;

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
    }

    protected async safeExecute<T>(
        operation: () => Promise<T>,
        errorMessage = 'Erro na operação'
    ): Promise<T | null> {
        this.loading = true;
        this.error = null;
        try {
            return await operation();
        } catch (err: any) {
            this.error = err.message || errorMessage;
            this.notify.error(errorMessage);
            return null;
        } finally {
            this.loading = false;
        }
    }

    protected navigateBack() {
        history.back();
    }
}
