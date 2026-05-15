import { TestBed } from '@angular/core/testing';
import { QuoteService, QuotePayload, QuoteResponse } from './quote.service';
import { SupabaseService } from './supabase.service';
import { QuoteStatus } from '../types';

describe('QuoteService', () => {
    let service: QuoteService;
    let mockFrom: any;
    let mockClient: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockFrom = {
            insert: vi.fn().mockResolvedValue({ error: null }),
            select: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({ data: [{ id: '1', status: QuoteStatus.SUBMITTED, created_at: new Date().toISOString() }] }),
                    single: vi.fn().mockResolvedValue({ data: { id: '1' } }),
                }),
            }),
            update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
        };
        mockClient = { from: vi.fn().mockReturnValue(mockFrom) };
        TestBed.configureTestingModule({
            providers: [QuoteService, { provide: SupabaseService, useValue: { client: mockClient } }]
        });
        service = TestBed.inject(QuoteService);
    });

    it('should insert a row when creating a quote', async () => {
        const payload: QuotePayload = {
            expertId: 'exp-1', requesterName: 'João', requesterEmail: 'joao@test.com', caseDescription: 'Preciso de perícia',
        };
        await service.createQuote(payload);
        expect(mockFrom.insert).toHaveBeenCalledWith(expect.objectContaining({
            expert_id: 'exp-1', requester_name: 'João',
        }));
    });

    it('should set status to under_review when responding', async () => {
        const response: QuoteResponse = { proposedValue: 500, deadline: '15 dias', notes: 'Inclui laudo' };
        await service.respondToQuote('quote-1', response);
        expect(mockFrom.update).toHaveBeenCalledWith(expect.objectContaining({
            proposed_value: 500, status: QuoteStatus.UNDER_REVIEW,
        }));
    });

    it('should query quotes table for sent quotes', async () => {
        await service.getSentQuotes('user-1');
        expect(mockClient.from).toHaveBeenCalledWith('quotes');
    });

    it('should set status to approved when accepting', async () => {
        await service.acceptQuote('quote-1');
        expect(mockFrom.update).toHaveBeenCalledWith({ status: QuoteStatus.APPROVED });
    });

    it('should set status to rejected when rejecting', async () => {
        await service.rejectQuote('quote-1');
        expect(mockFrom.update).toHaveBeenCalledWith({ status: QuoteStatus.REJECTED });
    });
});
