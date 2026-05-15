import { TestBed } from '@angular/core/testing';
import { ChatService } from './chat.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';

describe('ChatService', () => {
    let service: ChatService;
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = {
            client: {
                from: vi.fn().mockReturnValue({
                    select: vi.fn().mockReturnValue({
                        eq: vi.fn().mockReturnValue({
                            order: vi.fn().mockResolvedValue({ data: [] }),
                        }),
                    }),
                    insert: vi.fn().mockResolvedValue({ error: null }),
                }),
                channel: vi.fn().mockReturnValue({ on: vi.fn().mockReturnValue({ subscribe: vi.fn() }) }),
                removeChannel: vi.fn(),
            },
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
        };
        TestBed.configureTestingModule({
            providers: [
                ChatService,
                { provide: SupabaseService, useValue: mockSupabase },
                { provide: AuthService, useValue: { userProfile: () => ({ id: 'test-user' }), initialized: Promise.resolve() } },
            ]
        });
        service = TestBed.inject(ChatService);
    });

    it('should start with empty messages', () => {
        expect(service.messages()).toEqual([]);
    });

    it('should start with loading false', () => {
        expect(service.loading()).toBe(false);
    });

    it('should fetch messages from Supabase', async () => {
        await service.loadMessages('quote-1');
        expect(mockSupabase.client.from).toHaveBeenCalledWith('messages');
    });

    it('should insert message when sending', async () => {
        mockSupabase.client.from.mockReturnValue({
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [] }) }) }),
            insert: vi.fn().mockResolvedValue({ error: null }),
        });
        await service.sendMessage('quote-1', 'Olá!');
        expect(mockSupabase.client.from).toHaveBeenCalledWith('messages');
    });
});
