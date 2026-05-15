import { TestBed } from '@angular/core/testing';
import { LeadNotificationService } from './lead-notification.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { NotificationService } from './notification.service';

describe('LeadNotificationService', () => {
    let service: LeadNotificationService;
    let mockChannel: any;

    beforeEach(() => {
        mockChannel = { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
        const mockClient = { channel: vi.fn().mockReturnValue(mockChannel), removeChannel: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                LeadNotificationService,
                { provide: SupabaseService, useValue: { client: mockClient } },
                { provide: AuthService, useValue: { initialized: Promise.resolve(), userProfile: () => ({ id: 'expert-1', role: 'PERITO' }) } },
                { provide: NotificationService, useValue: { info: vi.fn(), success: vi.fn() } },
            ]
        });
        service = TestBed.inject(LeadNotificationService);
    });

    it('should start with unread count 0', () => {
        expect(service.unreadCount()).toBe(0);
    });

    it('should start listening for experts', async () => {
        await service.startListening();
        expect(mockChannel.on).toHaveBeenCalled();
    });

    it('should not listen for non-experts', async () => {
        const { LeadNotificationService: LNS } = await import('./lead-notification.service');
        TestBed.resetTestingModule();
        const chan = { on: vi.fn().mockReturnThis(), subscribe: vi.fn() };
        TestBed.configureTestingModule({
            providers: [
                LNS,
                { provide: SupabaseService, useValue: { client: { channel: vi.fn().mockReturnValue(chan) } } },
                { provide: AuthService, useValue: { initialized: Promise.resolve(), userProfile: () => ({ id: 'client-1', role: 'CONTRATANTE' }) } },
                { provide: NotificationService, useValue: { info: vi.fn(), success: vi.fn() } },
            ]
        });
        const svc = TestBed.inject(LNS);
        await svc.startListening();
        expect(chan.on).not.toHaveBeenCalled();
    });

    it('should reset unread count on markAllRead', () => {
        service.unreadCount.set(5);
        service.markAllRead();
        expect(service.unreadCount()).toBe(0);
    });
});
