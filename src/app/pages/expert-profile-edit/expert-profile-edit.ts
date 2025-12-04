import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { SupabaseService } from '../../services/supabase.service';

@Component({
    selector: 'app-expert-profile-edit',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSnackBarModule
    ],
    templateUrl: './expert-profile-edit.html',
    styleUrl: './expert-profile-edit.scss'
})
export class ExpertProfileEdit implements OnInit {
    profileForm: FormGroup;
    loading = false;
    userId: string | null = null;

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService,
        private router: Router,
        private snackBar: MatSnackBar
    ) {
        this.profileForm = this.fb.group({
            full_name: ['', Validators.required],
            specialty: ['', Validators.required],
            bio: ['', [Validators.required, Validators.minLength(50)]],
            phone: ['', Validators.required],
            city: ['', Validators.required],
            state: ['', Validators.required],
            hourly_rate: ['', [Validators.required, Validators.min(0)]]
        });
    }

    async ngOnInit() {
        this.loading = true;
        try {
            const { data: { user } } = await this.supabaseService.getUser();
            if (!user) {
                this.router.navigate(['/login']);
                return;
            }
            this.userId = user.id;
            const { data: profile, error } = await this.supabaseService.getProfile(this.userId);

            if (error) throw error;

            if (profile) {
                this.profileForm.patchValue(profile);
            }
        } catch (error: any) {
            this.snackBar.open('Erro ao carregar perfil: ' + error.message, 'Fechar', { duration: 3000 });
        } finally {
            this.loading = false;
        }
    }

    async onSubmit() {
        if (this.profileForm.valid && this.userId) {
            this.loading = true;
            try {
                const { error } = await this.supabaseService.updateProfile(this.userId, this.profileForm.value);
                if (error) throw error;

                this.snackBar.open('Perfil atualizado com sucesso!', 'Fechar', { duration: 3000 });
            } catch (error: any) {
                this.snackBar.open('Erro ao atualizar perfil: ' + error.message, 'Fechar', { duration: 3000 });
            } finally {
                this.loading = false;
            }
        }
    }
}
