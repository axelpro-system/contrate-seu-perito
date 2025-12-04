import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-register-expert',
  standalone: true,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSnackBarModule
  ],
  templateUrl: './register-expert.html',
  styleUrl: './register-expert.scss',
})
export class RegisterExpert {
  registerForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private supabaseService: SupabaseService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { 'mismatch': true };
  }

  async onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      const { name, email, password } = this.registerForm.value;

      try {
        // 1. Sign up the user
        const { data: authData, error: authError } = await this.supabaseService.signUp(email, password, {
          full_name: name,
          role: 'expert'
        });

        if (authError) throw authError;

        this.snackBar.open('Cadastro de Perito realizado! Verifique seu email para confirmar a conta.', 'Fechar', { duration: 5000 });
        this.router.navigate(['/login']);

      } catch (error: any) {
        this.snackBar.open(error.message || 'Erro ao cadastrar perito.', 'Fechar', { duration: 3000 });
      } finally {
        this.loading = false;
      }
    }
  }
}