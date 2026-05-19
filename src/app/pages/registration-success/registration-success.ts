import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-registration-success',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatSnackBarModule
    ],
    templateUrl: './registration-success.html',
    styleUrls: ['./registration-success.scss']
})
export class RegistrationSuccess implements OnInit {
    private supabase = inject(SupabaseService);
    private auth = inject(AuthService);
    private snackBar = inject(MatSnackBar);
    
    loading = false;
    expertName = '';
    submittedAt: Date | null = null;

    async ngOnInit() {
        // Registrar log de submissão automaticamente
        await this.logRegistrationSubmitted();
    }

    async logRegistrationSubmitted() {
        try {
            const user = this.auth.userProfile();
            
            if (!user?.id) {
                console.log('Usuário não autenticado, log não registrado');
                return;
            }

            this.expertName = `${user.first_name} ${user.last_name}`.trim();

            // Atualizar status no perfil (o trigger vai criar o log automaticamente)
            const { error } = await this.supabase.client
                .from('profiles')
                .update({
                    registration_status: 'submitted',
                    registration_submitted_at: new Date().toISOString(),
                    account_status: 'PENDING',
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id)
                .eq('profile_type', 'PERITO');

            if (error) {
                console.error('Erro ao atualizar status de registro:', error);
            } else {
                this.submittedAt = new Date();
                console.log('Status de registro atualizado com sucesso');
            }

        } catch (err) {
            console.error('Erro ao registrar log de submissão:', err);
        }
    }

    async resubmitRegistration() {
        // Recarregar a página pode re-trigger o log
        window.location.reload();
    }
}
