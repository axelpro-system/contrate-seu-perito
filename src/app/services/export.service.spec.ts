import { TestBed } from '@angular/core/testing';
import { ExportService } from './export.service';
import { SupabaseService } from './supabase.service';

function createChain(resolveValue: any) {
  const thenable: any = {
    then: (onFulfilled?: any, onRejected?: any) =>
      (resolveValue instanceof Error ? Promise.reject(resolveValue) : Promise.resolve(resolveValue))
        .then(onFulfilled, onRejected),
  };
  ['select', 'eq', 'order', 'gte', 'lte'].forEach(m => {
    thenable[m] = vi.fn(() => thenable);
  });
  return thenable;
}

describe('ExportService', () => {
  let service: ExportService;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.Blob = vi.fn() as any;
    globalThis.URL = { createObjectURL: vi.fn().mockReturnValue('blob:url'), revokeObjectURL: vi.fn() } as any;
    document.createElement = vi.fn().mockReturnValue({ href: '', download: '', click: vi.fn() }) as any;

    mockClient = { from: vi.fn() };
    TestBed.configureTestingModule({
      providers: [ExportService, { provide: SupabaseService, useValue: { client: mockClient } }],
    });
    service = TestBed.inject(ExportService);
  });

  it('should exportUsers with filters', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [], error: null }));

    await service.exportUsers({ type: 'PERITO', status: 'ACTIVE' });

    expect(mockClient.from).toHaveBeenCalledWith('profiles');
  });

  it('should exportUsers without filters', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [], error: null }));

    await service.exportUsers();

    expect(mockClient.from).toHaveBeenCalledWith('profiles');
  });

  it('should exportUsers throw on error', async () => {
    mockClient.from.mockReturnValue(createChain(new Error('DB error')));

    await expect(service.exportUsers()).rejects.toThrow('DB error');
  });

  it('should exportExperts', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [], error: null }));

    await service.exportExperts();

    expect(mockClient.from).toHaveBeenCalledWith('profiles');
  });

  it('should exportQuotes with date range', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [], error: null }));

    await service.exportQuotes('2026-01-01', '2026-06-01');

    expect(mockClient.from).toHaveBeenCalledWith('quotes');
  });

  it('should exportQuotes without date range', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [], error: null }));

    await service.exportQuotes();

    expect(mockClient.from).toHaveBeenCalledWith('quotes');
  });

  it('should exportTickets with status filter', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [], error: null }));

    await service.exportTickets('open');

    expect(mockClient.from).toHaveBeenCalledWith('support_tickets');
  });

  it('should exportAppointments with date range', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [], error: null }));

    await service.exportAppointments('2026-06-01', '2026-06-30');

    expect(mockClient.from).toHaveBeenCalledWith('appointments');
  });
});
