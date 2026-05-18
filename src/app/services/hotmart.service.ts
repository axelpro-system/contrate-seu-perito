import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface HotmartAuthResult {
    redirectUrl?: string;
    error?: string;
}

@Injectable({ providedIn: 'root' })
export class HotmartService {
    private readonly STATE_KEY = 'hotmart_state';

    generateAuthUrl(): string {
        const state = crypto.randomUUID();
        sessionStorage.setItem(this.STATE_KEY, state);
        const clientId = environment.hotmartClientId;
        const redirectUri = environment.appUrl + '/auth/callback';
        const params = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            response_type: 'code',
            state: state,
            scope: 'all',
        });
        return `https://api-sec-vlc.hotmart.com/security/oauth/authorize?${params.toString()}`;
    }

    validateState(incomingState: string | null): boolean {
        const savedState = sessionStorage.getItem(this.STATE_KEY);
        sessionStorage.removeItem(this.STATE_KEY);
        return !!(savedState && incomingState && savedState === incomingState);
    }

    redirectToAuth(): void {
        window.location.href = this.generateAuthUrl();
    }

    async handleCallback(code: string, state: string | null): Promise<HotmartAuthResult> {
        if (!this.validateState(state)) {
            return { error: 'Falha na validação de segurança. Tente novamente.' };
        }

        try {
            const response = await fetch(`${environment.supabaseFunctionsUrl}/hotmart-auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    redirect_uri: environment.appUrl + '/auth/callback',
                    state,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data?.redirectUrl) {
                return { redirectUrl: data.redirectUrl };
            }
            return { error: 'Resposta inválida do servidor.' };
        } catch (err: any) {
            return { error: err.message || 'Falha ao processar login.' };
        }
    }

    async verifySubscription(userId: string): Promise<boolean> {
        try {
            const response = await fetch(`${environment.supabaseFunctionsUrl}/verify-hotmart-subscription`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });
            if (!response.ok) return false;
            const data = await response.json();
            return data.active === true;
        } catch {
            return false;
        }
    }
}
