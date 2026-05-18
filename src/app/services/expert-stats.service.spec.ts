import { TestBed } from '@angular/core/testing';
import { ExpertStatsService } from './expert-stats.service';
import { SupabaseService } from './supabase.service';

function createChain(resolveValue: any) {
  const thenable: any = {
    then: (onFulfilled?: any, onRejected?: any) =>
      (resolveValue instanceof Error ? Promise.reject(resolveValue) : Promise.resolve(resolveValue))
        .then(onFulfilled, onRejected),
  };
  ['select', 'eq', 'order', 'single'].forEach(m => {
    thenable[m] = vi.fn(() => thenable);
  });
  return thenable;
}

describe('ExpertStatsService', () => {
  let service: ExpertStatsService;
  let mockClient: any;

  function makeQuote(overrides: Partial<any> = {}): any {
    return {
      id: 'q-1', expert_id: 'exp-1', requester_name: 'João',
      requester_email: 'joao@test.com', status: 'submitted',
      proposed_value: null, responded_at: null,
      created_at: new Date().toISOString(),
      ...overrides,
    };
  }

  function makeReview(rating: number): any {
    return { id: `r-${rating}`, expert_id: 'exp-1', rating };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = { from: vi.fn() };
    TestBed.configureTestingModule({
      providers: [ExpertStatsService, { provide: SupabaseService, useValue: { client: mockClient } }],
    });
    service = TestBed.inject(ExpertStatsService);
  });

  it('should compute stats from quotes and reviews', async () => {
    const quotes = [
      makeQuote({ id: 'q1', status: 'approved', proposed_value: 1000, responded_at: new Date().toISOString(), created_at: new Date(Date.now() - 86400000).toISOString() }),
      makeQuote({ id: 'q2', status: 'approved', proposed_value: 2000, responded_at: new Date().toISOString(), created_at: new Date(Date.now() - 7200000).toISOString() }),
      makeQuote({ id: 'q3', status: 'rejected', responded_at: new Date().toISOString(), created_at: new Date(Date.now() - 3600000).toISOString() }),
      makeQuote({ id: 'q4', status: 'submitted', responded_at: null }),
    ];
    const reviews = [makeReview(5), makeReview(4), makeReview(5)];
    const profile = { id: 'exp-1', rating: 4.5, reviews_count: 10 };

    mockClient.from
      .mockReturnValueOnce(createChain({ data: quotes, error: null }))
      .mockReturnValueOnce(createChain({ data: reviews, error: null }))
      .mockReturnValueOnce(createChain({ data: profile, error: null }));

    await service.loadStats('exp-1');

    const s = service.stats()!;
    expect(s.totalLeads).toBe(4);
    expect(s.respondedLeads).toBe(3);
    expect(s.acceptedLeads).toBe(2);
    expect(s.conversionRate).toBe(50);
    expect(s.totalRevenue).toBe(3000);
    expect(s.totalReviews).toBe(3);
    expect(s.avgRating).toBe(4.7);
    expect(s.reviewDistribution[5]).toBe(2);
    expect(s.reviewDistribution[4]).toBe(1);
    expect(s.avgResponseTimeHours).toBeGreaterThan(0);
  });

  it('should handle empty data', async () => {
    mockClient.from
      .mockReturnValueOnce(createChain({ data: [], error: null }))
      .mockReturnValueOnce(createChain({ data: [], error: null }))
      .mockReturnValueOnce(createChain({ data: { id: 'exp-1', rating: 0, reviews_count: 0 }, error: null }));

    await service.loadStats('exp-1');

    const s = service.stats()!;
    expect(s.totalLeads).toBe(0);
    expect(s.conversionRate).toBe(0);
    expect(s.totalRevenue).toBe(0);
    expect(s.avgResponseTimeHours).toBe(0);
    expect(s.leadsByMonth.length).toBe(6);
  });

  it('should handle null data from DB', async () => {
    mockClient.from
      .mockReturnValueOnce(createChain({ data: null, error: null }))
      .mockReturnValueOnce(createChain({ data: null, error: null }))
      .mockReturnValueOnce(createChain({ data: null, error: null }));

    await service.loadStats('exp-1');

    const s = service.stats()!;
    expect(s.totalLeads).toBe(0);
    expect(s.totalReviews).toBe(0);
  });
});
