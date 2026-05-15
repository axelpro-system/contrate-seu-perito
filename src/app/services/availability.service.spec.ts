import { TestBed } from '@angular/core/testing';
import { AvailabilityService } from './availability.service';
import { SupabaseService } from './supabase.service';

describe('AvailabilityService', () => {
    let service: AvailabilityService;
    let mockFrom: any;
    let mockEq: any;

    beforeEach(() => {
        mockEq = vi.fn();
        mockFrom = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            insert: vi.fn().mockResolvedValue({ error: null }),
            delete: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
        };
        const mockClient = { from: vi.fn().mockReturnValue(mockFrom) };
        TestBed.configureTestingModule({
            providers: [AvailabilityService, { provide: SupabaseService, useValue: { client: mockClient } }],
        });
        service = TestBed.inject(AvailabilityService);
    });

    it('should load slots and update signal', async () => {
        const data = [{ id: '1', expert_id: 'e1', day_of_week: 1, start_time: '09:00', end_time: '12:00', active: true }];
        const chainedOrder = vi.fn().mockResolvedValue({ data, error: null });
        mockFrom.order = vi.fn().mockReturnValue({ order: chainedOrder });
        await service.load('expert-1');
        expect(service.slots().length).toBe(1);
    });

    it('should set empty array when load returns null', async () => {
        const chainedOrder = vi.fn().mockResolvedValue({ data: null, error: null });
        mockFrom.order = vi.fn().mockReturnValue({ order: chainedOrder });
        await service.load('expert-1');
        expect(service.slots()).toEqual([]);
    });

    it('should insert slot and reload on addSlot', async () => {
        const chain1: any = { order: vi.fn().mockResolvedValue({ data: [], error: null }) };
        mockFrom.order = vi.fn().mockReturnValue(chain1);
        await service.addSlot('e1', 2, '10:00', '11:00');
        expect(mockFrom.insert).toHaveBeenCalledWith({ expert_id: 'e1', day_of_week: 2, start_time: '10:00', end_time: '11:00' });
    });

    it('should remove slot from signal on removeSlot', async () => {
        service.slots.set([{ id: 's1', expert_id: 'e1', day_of_week: 1, start_time: '09:00', end_time: '12:00', active: true }]);
        mockFrom.eq = vi.fn().mockResolvedValue({ error: null });
        await service.removeSlot('s1');
        expect(service.slots().length).toBe(0);
    });

    it('should toggle active state on toggleSlot', async () => {
        service.slots.set([{ id: 's1', expert_id: 'e1', day_of_week: 1, start_time: '09:00', end_time: '12:00', active: false }]);
        mockFrom.eq = vi.fn().mockResolvedValue({ error: null });
        await service.toggleSlot('s1', true);
        expect(service.slots()[0].active).toBe(true);
    });

    it('should return day label for getDayLabel', () => {
        expect(service.getDayLabel(0)).toBe('Dom');
        expect(service.getDayLabel(6)).toBe('Sáb');
        expect(service.getDayLabel(7)).toBe('');
    });
});
