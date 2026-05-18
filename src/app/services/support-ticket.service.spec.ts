import { TestBed } from '@angular/core/testing';
import { SupportTicketService } from './support-ticket.service';
import { SupabaseService } from './supabase.service';
import type { SupportTicket } from '../types';

function createChain(resolveValue: any) {
  const thenable: any = {
    then: (onFulfilled?: any, onRejected?: any) =>
      (resolveValue instanceof Error ? Promise.reject(resolveValue) : Promise.resolve(resolveValue))
        .then(onFulfilled, onRejected),
  };
  ['select', 'eq', 'order', 'insert', 'update'].forEach(m => {
    thenable[m] = vi.fn(() => thenable);
  });
  thenable.single = vi.fn(() => thenable);
  return thenable;
}

describe('SupportTicketService', () => {
  let service: SupportTicketService;
  let mockClient: any;

  function makeTicket(overrides: Partial<SupportTicket> = {}): SupportTicket {
    return {
      id: 'ticket-1', user_id: 'user-1', subject: 'Problema no cadastro',
      description: 'Não consigo alterar meu email', priority: 'medium',
      status: 'open', assigned_to: null,
      created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z',
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = { from: vi.fn() };
    TestBed.configureTestingModule({
      providers: [SupportTicketService, { provide: SupabaseService, useValue: { client: mockClient } }],
    });
    service = TestBed.inject(SupportTicketService);
  });

  it('should loadMyTickets', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [makeTicket()], error: null }));

    await service.loadMyTickets('user-1');

    expect(mockClient.from).toHaveBeenCalledWith('support_tickets');
    expect(service.tickets().length).toBe(1);
    expect(service.loading()).toBe(false);
  });

  it('should loadMyTickets set empty when null', async () => {
    mockClient.from.mockReturnValue(createChain({ data: null, error: null }));

    await service.loadMyTickets('user-1');

    expect(service.tickets()).toEqual([]);
  });

  it('should loadAllTickets', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [makeTicket()], error: null }));

    await service.loadAllTickets();

    expect(mockClient.from).toHaveBeenCalledWith('support_tickets');
  });

  it('should create ticket and prepend to signal', async () => {
    const newTicket = makeTicket({ id: 'ticket-2' });
    mockClient.from.mockReturnValue(createChain({ data: newTicket, error: null }));

    const result = await service.create('user-1', 'Assunto', 'Descrição', 'high');

    expect(result.id).toBe('ticket-2');
    expect(service.tickets()[0].id).toBe('ticket-2');
  });

  it('should create throw on error', async () => {
    mockClient.from.mockReturnValue(createChain(new Error('Insert failed')));

    await expect(service.create('user-1', 'A', 'B')).rejects.toThrow('Insert failed');
  });

  it('should updateStatus on DB and signal', async () => {
    service.tickets.set([makeTicket()]);
    mockClient.from.mockReturnValue(createChain({ error: null }));

    await service.updateStatus('ticket-1', 'resolved');

    expect(service.tickets()[0].status).toBe('resolved');
  });

  it('should assign ticket', async () => {
    mockClient.from.mockReturnValue(createChain({ error: null }));

    await service.assign('ticket-1', 'admin-1');

    expect(mockClient.from).toHaveBeenCalledWith('support_tickets');
  });

  it('should getMessages for a ticket', async () => {
    const messages = [
      { id: 'm1', ticket_id: 'ticket-1', sender_id: 'user-1', message: 'Olá', is_internal: false, created_at: '2026-05-01T00:00:00Z' },
    ];
    mockClient.from.mockReturnValue(createChain({ data: messages, error: null }));

    const result = await service.getMessages('ticket-1');

    expect(result.length).toBe(1);
    expect(result[0].message).toBe('Olá');
  });

  it('should getMessages return empty when null', async () => {
    mockClient.from.mockReturnValue(createChain({ data: null, error: null }));

    expect(await service.getMessages('ticket-1')).toEqual([]);
  });

  it('should getMessages throw on error', async () => {
    mockClient.from.mockReturnValue(createChain(new Error('Query failed')));

    await expect(service.getMessages('ticket-1')).rejects.toThrow('Query failed');
  });

  it('should sendMessage insert', async () => {
    mockClient.from.mockReturnValue(createChain({ error: null }));

    await service.sendMessage('ticket-1', 'user-1', 'Minha mensagem', false);

    expect(mockClient.from).toHaveBeenCalledWith('ticket_messages');
  });

  it('should sendMessage throw on error', async () => {
    mockClient.from.mockReturnValue(createChain(new Error('Insert failed')));

    await expect(service.sendMessage('ticket-1', 'user-1', 'Msg')).rejects.toThrow('Insert failed');
  });

  it('should getTicketById', async () => {
    const ticket = makeTicket({ user_id: 'user-1' }) as any;
    mockClient.from.mockReturnValue(createChain({ data: ticket, error: null }));

    const result = await service.getTicketById('ticket-1');

    expect(result.id).toBe('ticket-1');
  });
});
