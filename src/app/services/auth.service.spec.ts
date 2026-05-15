import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { SupabaseService } from './supabase.service';

describe('AuthService', () => {
    beforeEach(() => TestBed.resetTestingModule());

    function makeMock(session?: any) {
        const mock: any = {
            client: {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            single: vi.fn().mockResolvedValue({ data: session ? { id: 'u1', first_name: 'João', profile_type: 'PERITO', contact_email: 'joao@test.com' } : null, error: null }),
                        }),
                    }),
                }),
                auth: { onAuthStateChange: vi.fn() },
                channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnValue({ subscribe: vi.fn() }) }),
            },
            getSession: vi.fn().mockResolvedValue({ data: { session: session || null }, error: null }),
            getUser: vi.fn().mockResolvedValue({ data: { user: session?.user || null }, error: null }),
            getProfile: vi.fn().mockResolvedValue({ data: session ? { id: 'u1', first_name: 'João', profile_type: 'PERITO', contact_email: 'joao@test.com' } : null, error: null }),
            signOut: vi.fn().mockResolvedValue({ error: null }),
        };
        return mock;
    }

    function createService(session?: any): AuthService {
        TestBed.configureTestingModule({ providers: [AuthService, { provide: SupabaseService, useValue: makeMock(session) }] });
        return TestBed.inject(AuthService);
    }

    it('should set authenticated when session exists', async () => {
        const svc = createService({ user: { id: 'u1' } });
        await svc.initialized;
        expect(svc.authenticated()).toBe(true);
    });

    it('should load user profile with session', async () => {
        const svc = createService({ user: { id: 'u1' } });
        await svc.initialized;
        expect(svc.userProfile()?.first_name).toBe('João');
    });

    it('should remain unauthenticated without session', async () => {
        const svc = createService();
        await svc.initialized;
        expect(svc.authenticated()).toBe(false);
    });

    it('should return null profile without session', async () => {
        const svc = createService();
        await svc.initialized;
        expect(svc.userProfile()).toBeNull();
    });
});
