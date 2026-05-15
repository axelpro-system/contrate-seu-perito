import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

export interface RegisterFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class FormService {
    constructor(private fb: FormBuilder) { }

    createRegisterForm(): FormGroup {
        return this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, { validators: this.passwordMatchValidator });
    }

    private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
        const password = group.get('password')?.value;
        const confirmPassword = group.get('confirmPassword')?.value;
        return password === confirmPassword ? null : { 'mismatch': true };
    }

    sanitizeString(value: string): string {
        return value.trim().replace(/[<>]/g, '');
    }

    validateForm(form: FormGroup): boolean {
        if (form.invalid) {
            form.markAllAsTouched();
            return false;
        }
        return true;
    }
}
