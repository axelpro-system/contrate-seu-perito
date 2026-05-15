import { TestBed } from '@angular/core/testing';
import { PortfolioService } from './portfolio.service';
import { SupabaseService } from './supabase.service';

describe('PortfolioService', () => {
    let service: PortfolioService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                PortfolioService,
                { provide: SupabaseService, useValue: { client: { from: () => ({ select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [] }) }) }) }), storage: { from: () => ({ upload: () => Promise.resolve({}), getPublicUrl: () => ({ data: { publicUrl: '' } }) }) } } } },
            ]
        });
        service = TestBed.inject(PortfolioService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should start with empty items', () => {
        expect(service.items()).toEqual([]);
    });
});
