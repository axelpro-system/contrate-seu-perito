import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { ExpertProfile } from './pages/expert-profile/expert-profile';
import { Dashboard } from './pages/dashboard/dashboard';
import { Login } from './pages/login/login';
import { RegisterExpert } from './pages/register-expert/register-expert';
import { ExpertCard } from './components/expert-card/expert-card';
import { SearchExperts } from './pages/search-experts/search-experts';
import { Register } from './pages/register/register';

import { ExpertProfileEdit } from './pages/expert-profile-edit/expert-profile-edit';

import { ClientDashboard } from './pages/client-dashboard/client-dashboard';
import { ExpertDashboard } from './pages/expert-dashboard/expert-dashboard';

import { authGuard } from './guards/auth.guard';

import { ForgotPassword } from './pages/forgot-password/forgot-password';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'client-dashboard', component: ClientDashboard, canActivate: [authGuard] },
    { path: 'expert-dashboard', component: ExpertDashboard, canActivate: [authGuard] },
    { path: 'expert/edit', component: ExpertProfileEdit, canActivate: [authGuard] },
    { path: 'expert/:id', component: ExpertProfile },
    { path: 'dashboard', component: Dashboard, canActivate: [authGuard] }, // Keep for fallback or admin
    { path: 'login', component: Login },
    { path: 'forgot-password', component: ForgotPassword },
    { path: 'register-expert', component: RegisterExpert },
    { path: 'register', component: Register },
    { path: 'search', component: SearchExperts },
    { path: 'expert-card', component: ExpertCard },
    { path: '**', redirectTo: '' }
];
