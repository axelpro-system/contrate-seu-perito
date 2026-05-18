import { TestBed } from '@angular/core/testing';
import { AppointmentService } from './appointment.service';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { AvailabilityService } from './availability.service';
import type { Appointment } from '../types';

function createChain(resolveValue: any) {
  const thenable: any = {
    then: (onFulfilled?: any, onRejected?: any) =>
      (resolveValue instanceof Error ? Promise.reject(resolveValue) : Promise.resolve(resolveValue))
        .then(onFulfilled, onRejected),
  };
  ['select', 'eq', 'gte', 'lte', 'not', 'or', 'insert', 'update'].forEach(m => {
    thenable[m] = vi.fn(() => thenable);
  });
  thenable.order = vi.fn(() => thenable);
  thenable.limit = vi.fn(() => thenable);
  thenable.single = vi.fn(() => thenable);
  return thenable;
}

describe('AppointmentService', () => {
  let service: AppointmentService;
  let mockClient: any;
  let mockAvail: any;

  function makeAppt(overrides: Partial<Appointment> = {}): Appointment {
    return {
      id: 'appt-1', quote_id: null, expert_id: 'exp-1', client_id: 'cli-1',
      appointment_date: '2026-06-01', start_time: '09:00', end_time: '10:00',
      status: 'pending', notes: null, cancelled_by: null, cancellation_reason: null,
      created_at: '2026-05-01T00:00:00Z', updated_at: '2026-05-01T00:00:00Z',
      ...overrides,
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockClient = {
      from: vi.fn(),
      channel: vi.fn().mockReturnValue({
        on: vi.fn().mockReturnValue({
          on: vi.fn().mockReturnValue({ subscribe: vi.fn() }),
        }),
      }),
      removeChannel: vi.fn(),
    };
    mockAvail = {
      load: vi.fn().mockResolvedValue(undefined),
      slots: vi.fn().mockReturnValue([
        { id: 's1', expert_id: 'exp-1', day_of_week: 1, start_time: '09:00', end_time: '12:00', active: true },
      ]),
    };
    TestBed.configureTestingModule({
      providers: [
        AppointmentService,
        { provide: SupabaseService, useValue: { client: mockClient } },
        { provide: NotificationService, useValue: { show: vi.fn() } },
        { provide: AvailabilityService, useValue: mockAvail },
      ],
    });
    service = TestBed.inject(AppointmentService);
  });

  it('should loadForExpert and update signal', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [makeAppt()], error: null }));

    await service.loadForExpert('exp-1');

    expect(service.appointments().length).toBe(1);
    expect(service.loading()).toBe(false);
  });

  it('should loadForExpert with date filter', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [makeAppt()], error: null }));

    await service.loadForExpert('exp-1', '2026-06-01');

    expect(service.appointments().length).toBe(1);
  });

  it('should loadForExpert set empty when data is null', async () => {
    mockClient.from.mockReturnValue(createChain({ data: null, error: null }));

    await service.loadForExpert('exp-1');

    expect(service.appointments()).toEqual([]);
  });

  it('should loadForClient', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [makeAppt()], error: null }));

    await service.loadForClient('cli-1');

    expect(mockClient.from).toHaveBeenCalledWith('appointments');
    expect(service.appointments().length).toBe(1);
  });

  it('should loadForRange', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [makeAppt()], error: null }));

    await service.loadForRange('exp-1', '2026-06-01', '2026-06-30');

    expect(service.appointments().length).toBe(1);
  });

  it('should checkConflict return true when exists', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [{ id: 'other' }], error: null }));

    expect(await service.checkConflict('exp-1', '2026-06-01', '09:00', '10:00')).toBe(true);
  });

  it('should checkConflict return false when none', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [], error: null }));

    expect(await service.checkConflict('exp-1', '2026-06-01', '09:00', '10:00')).toBe(false);
  });

  it('should checkConflict return false when null', async () => {
    mockClient.from.mockReturnValue(createChain({ data: null, error: null }));

    expect(await service.checkConflict('exp-1', '2026-06-01', '09:00', '10:00')).toBe(false);
  });

  it('should create throw when date is past', async () => {
    await expect(service.create({
      expert_id: 'exp-1', client_id: 'cli-1',
      appointment_date: '2020-01-01', start_time: '09:00', end_time: '10:00',
    })).rejects.toThrow('data passada');
  });

  it('should create throw when no availability slot', async () => {
    mockAvail.slots.mockReturnValue([]);
    await expect(service.create({
      expert_id: 'exp-1', client_id: 'cli-1',
      appointment_date: '2099-06-01', start_time: '09:00', end_time: '10:00',
    })).rejects.toThrow('disponibilidade');
  });

  it('should create throw when conflict exists', async () => {
    mockClient.from.mockReturnValue(createChain({ data: [{ id: 'other' }], error: null }));
    await expect(service.create({
      expert_id: 'exp-1', client_id: 'cli-1',
      appointment_date: '2099-06-01', start_time: '09:00', end_time: '10:00',
    })).rejects.toThrow('já agendado');
  });

  it('should create insert when valid', async () => {
    mockClient.from.mockReturnValue(createChain({ data: makeAppt(), error: null }));

    const result = await service.create({
      expert_id: 'exp-1', client_id: 'cli-1',
      appointment_date: '2099-06-01', start_time: '09:00', end_time: '10:00',
    });

    expect(result.id).toBe('appt-1');
  });

  it('should create throw on insert error', async () => {
    mockClient.from.mockReturnValue(createChain(new Error('DB error')));

    await expect(service.create({
      expert_id: 'exp-1', client_id: 'cli-1',
      appointment_date: '2099-06-01', start_time: '09:00', end_time: '10:00',
    })).rejects.toThrow('DB error');
  });

  it('should cancel and update signal', async () => {
    service.appointments.set([makeAppt()]);
    mockClient.from.mockReturnValue(createChain({ error: null }));

    await service.cancel('appt-1', 'user-1', 'Mudança');

    expect(service.appointments()[0].status).toBe('cancelled');
  });

  it('should cancel throw on error', async () => {
    mockClient.from.mockReturnValue(createChain(new Error('Update failed')));

    await expect(service.cancel('appt-1', 'user-1')).rejects.toThrow('Update failed');
  });

  it('should updateStatus and signal', async () => {
    service.appointments.set([makeAppt()]);
    mockClient.from.mockReturnValue(createChain({ error: null }));

    await service.updateStatus('appt-1', 'confirmed');

    expect(service.appointments()[0].status).toBe('confirmed');
  });

  it('should subscribeToUpdates', () => {
    service.subscribeToUpdates('exp-1');

    expect(mockClient.channel).toHaveBeenCalledWith('appointments');
  });

  it('should subscribe once', () => {
    service.subscribeToUpdates('exp-1');
    service.subscribeToUpdates('exp-1');

    expect(mockClient.channel).toHaveBeenCalledTimes(1);
  });

  it('should unsubscribe', () => {
    service.subscribeToUpdates('exp-1');
    service.unsubscribe();

    expect(mockClient.removeChannel).toHaveBeenCalled();
  });
});
