import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { authGuard } from './guards/auth.guard';
import { adminGuard } from './guards/admin.guard';
import { expertGuard } from './guards/expert.guard';

export const routes: Routes = [
    { path: '', component: Home },
    { path: 'client-dashboard', loadComponent: () => import('./pages/client-dashboard/client-dashboard').then(m => m.ClientDashboard), canActivate: [authGuard] },
    { path: 'expert-dashboard', loadComponent: () => import('./pages/expert-dashboard/expert-dashboard').then(m => m.ExpertDashboard), canActivate: [authGuard] },
    { path: 'expert/quotes', loadComponent: () => import('./pages/expert-leads/expert-leads').then(m => m.ExpertLeads), canActivate: [authGuard] },
    { path: 'expert/onboarding', loadComponent: () => import('./pages/expert-onboarding/expert-onboarding').then(m => m.ExpertOnboarding), canActivate: [authGuard] },
    { path: 'expert/edit', loadComponent: () => import('./pages/expert-profile-edit/expert-profile-edit').then(m => m.ExpertProfileEdit), canActivate: [authGuard, expertGuard] },
    { path: 'expert/:id', loadComponent: () => import('./pages/expert-profile/expert-profile').then(m => m.ExpertProfile) },
    { path: 'admin', loadComponent: () => import('./pages/admin-dashboard/admin-layout').then(m => m.AdminLayout), canActivate: [authGuard, adminGuard],
      children: [
        { path: '', loadComponent: () => import('./pages/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard) },
        { path: 'users', loadComponent: () => import('./pages/admin-dashboard/admin-users').then(m => m.AdminUsers) },
        { path: 'users/new', loadComponent: () => import('./pages/admin-dashboard/admin-user-create').then(m => m.AdminUserCreate) },
        { path: 'users/:id/edit', loadComponent: () => import('./pages/admin-dashboard/admin-user-edit').then(m => m.AdminUserEdit) },
        { path: 'specialties', loadComponent: () => import('./pages/admin-dashboard/admin-specialties').then(m => m.AdminSpecialties) },
        { path: 'tickets', loadComponent: () => import('./pages/admin-dashboard/admin-tickets').then(m => m.AdminTickets) },
        { path: 'logs', loadComponent: () => import('./pages/admin-dashboard/admin-logs').then(m => m.AdminLogs) },
        { path: 'pending-experts', loadComponent: () => import('./pages/admin-dashboard/admin-pending-experts').then(m => m.AdminPendingExperts) },
        { path: 'content-pages', loadComponent: () => import('./pages/admin-dashboard/admin-content-pages').then(m => m.AdminContentPages) },
        { path: 'broadcast', loadComponent: () => import('./pages/admin-dashboard/admin-broadcast').then(m => m.AdminBroadcast) },
        { path: 'moderation', loadComponent: () => import('./pages/admin-dashboard/admin-moderation').then(m => m.AdminModeration) },
        { path: 'email-templates', loadComponent: () => import('./pages/admin-dashboard/admin-email-templates').then(m => m.AdminEmailTemplates) },
        { path: 'finance', loadComponent: () => import('./pages/admin-dashboard/admin-finance').then(m => m.AdminFinance) },
        { path: 'monitoring', loadComponent: () => import('./pages/admin-dashboard/admin-monitoring').then(m => m.AdminMonitoring) },
        { path: 'reports', loadComponent: () => import('./pages/admin-dashboard/admin-reports').then(m => m.AdminReports) },
      ]
    },
    { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard), canActivate: [authGuard] },
    { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.Login) },
    { path: 'forgot-password', loadComponent: () => import('./pages/forgot-password/forgot-password').then(m => m.ForgotPassword) },
    { path: 'register-expert', loadComponent: () => import('./pages/register-expert/register-expert').then(m => m.RegisterExpert) },
    { path: 'register', loadComponent: () => import('./pages/register/register').then(m => m.Register) },
    { path: 'search', loadComponent: () => import('./pages/search-experts/search-experts').then(m => m.SearchExperts) },
    { path: 'auth/callback', loadComponent: () => import('./pages/auth-callback/auth-callback').then(m => m.AuthCallback) },
    { path: 'email-confirmation', loadComponent: () => import('./pages/email-confirmation/email-confirmation').then(m => m.EmailConfirmation) },
    { path: 'reset-password', loadComponent: () => import('./pages/reset-password/reset-password').then(m => m.ResetPassword) },
    { path: 'terms', loadComponent: () => import('./pages/terms/terms').then(m => m.Terms) },
    { path: 'privacy', loadComponent: () => import('./pages/privacy/privacy').then(m => m.Privacy) },
    { path: 'my-appointments', loadComponent: () => import('./pages/my-appointments/my-appointments').then(m => m.MyAppointments), canActivate: [authGuard] },
    { path: 'how-it-works', loadComponent: () => import('./pages/how-it-works/how-it-works').then(m => m.HowItWorks) },
    { path: 'support', loadComponent: () => import('./pages/support/support').then(m => m.SupportPage) },
    { path: 'faq', redirectTo: '/support' },
    { path: 'contact', redirectTo: '/support' },
    { path: '**', redirectTo: '' },
];
