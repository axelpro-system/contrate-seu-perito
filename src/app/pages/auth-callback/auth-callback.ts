import { Component, OnInit, inject, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HotmartService } from '../../services/hotmart.service';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-auth-callback',
    standalone: true,
    imports: [CommonModule, MatProgressSpinnerModule],
    template: `
    <div class="callback-container">
      <mat-spinner diameter="50"></mat-spinner>
      <p>{{ statusMessage }}</p>
    </div>
  `,
    styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 20px;
    }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallback implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private hotmartService = inject(HotmartService);
    private authService = inject(AuthService);
    private snackBar = inject(MatSnackBar);
    private cdr = inject(ChangeDetectorRef);

    statusMessage = 'Processando autenticação...';

    async ngOnInit() {
        const hash = window.location.hash.substring(1);
        const hashParams = new URLSearchParams(hash);

        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        const code = this.route.snapshot.queryParamMap.get('code');
        const error = this.route.snapshot.queryParamMap.get('error');
        const state = this.route.snapshot.queryParamMap.get('state');

        if (error) {
            if (error === 'access_denied') {
                this.handleError('Acesso negado. Por favor, tente novamente.');
            } else {
                this.handleError('Erro na autenticação: ' + error);
            }
            return;
        }

        if (accessToken && refreshToken) {
            await this.handleSupabaseCallback(type);
        } else if (code) {
            await this.handleHotmartCallback(code, state);
        } else {
            this.handleError('Tipo de callback não reconhecido.');
        }
    }

    private async handleSupabaseCallback(type: string | null) {
        try {
            await this.authService.initialized;
            const profile = this.authService.userProfile();

            if (profile) {
                if (type === 'recovery') {
                    this.statusMessage = 'Redefinindo senha...';
                    this.cdr.detectChanges();
                    this.router.navigate(['/reset-password'], { fragment: window.location.hash });
                } else if (type === 'signup') {
                    this.statusMessage = 'E-mail confirmado com sucesso!';
                    this.cdr.detectChanges();
                    const redirectUrl = this.authService.getRedirectUrl();
                    this.router.navigate([redirectUrl]);
                } else {
                    const redirectUrl = this.authService.getRedirectUrl();
                    this.router.navigate([redirectUrl]);
                }
            } else {
                this.handleError('Sessão não encontrada após confirmação.');
            }
        } catch (err) {
            console.error('Supabase callback error:', err);
            this.handleError('Erro ao processar confirmação de e-mail.');
        }
    }

    private async handleHotmartCallback(code: string, state: string | null) {
        const result = await this.hotmartService.handleCallback(code, state);

        if (result.error) {
            this.handleError(result.error);
            return;
        }

        if (result.redirectUrl) {
            window.location.href = result.redirectUrl;
        } else {
            this.handleError('Resposta inválida do servidor.');
        }
    }

    handleError(msg: string) {
        this.snackBar.open(msg, 'Fechar', { duration: 5000 });
        this.router.navigate(['/login']);
    }
}
