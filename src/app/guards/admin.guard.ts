import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = async () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    await authService.initialized;
    const profile = authService.userProfile();
    if (profile?.role === 'ADMIN') return true;
    router.navigate(['/']);
    return false;
};
