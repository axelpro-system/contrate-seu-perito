import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

describe('NotificationService', () => {
    let service: NotificationService;
    let mockFrom: any;

    beforeEach(() => {
        mockFrom = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            update: vi.fn().mockReturnThis(),
            insert: vi.fn().mockResolvedValue({ error: null }),
        };
        const mockClient = { from: vi.fn().mockReturnValue(mockFrom), channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnValue({ subscribe: vi.fn() }) }), removeChannel: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                NotificationService,
                { provide: SupabaseService, useValue: { client: mockClient } },
                { provide: AuthService, useValue: { initialized: Promise.resolve(), userProfile: () => ({ id: 'user-1' }) } },
                { provide: MatSnackBar, useValue: { open: vi.fn() } },
            ]
        });
        service = TestBed.inject(NotificationService);
    });

    it('should start with empty notifications', () => {
        expect(service.notifications().length).toBe(0);
        expect(service.unreadCount()).toBe(0);
    });

    it('should load notifications from database', async () => {
        const data = [
            { id: 'n1', user_id: 'user-1', type: 'new_lead', title: 'Novo lead', read: false, created_at: new Date().toISOString() },
            { id: 'n2', user_id: 'user-1', type: 'approval', title: 'Aprovado', read: true, created_at: new Date().toISOString() },
        ];
        mockFrom.limit.mockResolvedValue({ data, error: null });
        await service.loadNotifications();
        expect(service.notifications().length).toBe(2);
        expect(service.unreadCount()).toBe(1);
    });

    it('should not load when user is null', async () => {
        const { NotificationService: NS } = await import('./notification.service');
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                NS,
                { provide: SupabaseService, useValue: { client: { from: vi.fn() } } },
                { provide: AuthService, useValue: { initialized: Promise.resolve(), userProfile: () => null } },
                { provide: MatSnackBar, useValue: { open: vi.fn() } },
            ]
        });
        const svc = TestBed.inject(NS);
        await svc.loadNotifications();
        expect(svc.notifications().length).toBe(0);
    });

    it('should mark single notification as read', async () => {
        mockFrom.eq.mockResolvedValue({ error: null });
        await service.markAsRead('n1');
        expect(mockFrom.update).toHaveBeenCalledWith({ read: true });
    });

    it('should mark all as read and update signal', async () => {
        service.notifications.set([
            { id: 'n1', user_id: 'u1', type: 't', title: 'Test', body: null, data: null, read: false, created_at: '' },
        ]);
        service.unreadCount.set(1);
        const resolveEq2 = Promise.resolve({ error: null });
        mockFrom.eq = vi.fn(() => ({ eq: () => resolveEq2 }));
        await service.markAllAsRead();
        expect(service.unreadCount()).toBe(0);
        expect(service.notifications()[0].read).toBe(true);
    });

    it('should insert notification on createNotification', async () => {
        mockFrom.insert.mockResolvedValue({ error: null });
        await service.createNotification('user-2', 'test', 'Título', 'Corpo');
        expect(mockFrom.insert).toHaveBeenCalledWith({ user_id: 'user-2', type: 'test', title: 'Título', body: 'Corpo', data: undefined });
    });
});
