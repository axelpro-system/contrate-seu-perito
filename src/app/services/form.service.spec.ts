import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { FormService } from './form.service';

describe('FormService', () => {
    let service: FormService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [FormService, FormBuilder] });
        service = TestBed.inject(FormService);
    });

    it('should create a register form with all fields', () => {
        const form = service.createRegisterForm();
        expect(form.contains('name')).toBe(true);
        expect(form.contains('email')).toBe(true);
        expect(form.contains('password')).toBe(true);
        expect(form.contains('confirmPassword')).toBe(true);
    });

    it('should mark name as invalid when empty', () => {
        const form = service.createRegisterForm();
        const name = form.get('name');
        name?.setValue('');
        expect(name?.valid).toBe(false);
    });

    it('should mark email as invalid when not email', () => {
        const form = service.createRegisterForm();
        form.get('email')?.setValue('not-an-email');
        expect(form.get('email')?.valid).toBe(false);
    });

    it('should mark email as valid with correct email', () => {
        const form = service.createRegisterForm();
        form.get('email')?.setValue('test@email.com');
        expect(form.get('email')?.valid).toBe(true);
    });

    it('should return mismatch error when passwords differ', () => {
        const form = service.createRegisterForm();
        form.get('password')?.setValue('123456');
        form.get('confirmPassword')?.setValue('654321');
        expect(form.hasError('mismatch')).toBe(true);
    });

    it('should pass validation when passwords match', () => {
        const form = service.createRegisterForm();
        form.get('name')?.setValue('João');
        form.get('email')?.setValue('joao@test.com');
        form.get('password')?.setValue('123456');
        form.get('confirmPassword')?.setValue('123456');
        expect(form.valid).toBe(true);
    });

    it('should remove HTML tags from sanitizeString', () => {
        expect(service.sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
    });

    it('should trim whitespace on sanitizeString', () => {
        expect(service.sanitizeString('  João  ')).toBe('João');
    });

    it('should mark all fields as touched when validateForm fails', () => {
        const form = service.createRegisterForm();
        service.validateForm(form);
        expect(form.get('name')?.touched).toBe(true);
        expect(form.get('email')?.touched).toBe(true);
    });

    it('should return true when form is valid', () => {
        const form = service.createRegisterForm();
        form.get('name')?.setValue('João');
        form.get('email')?.setValue('joao@test.com');
        form.get('password')?.setValue('123456');
        form.get('confirmPassword')?.setValue('123456');
        expect(service.validateForm(form)).toBe(true);
    });
});
