import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { NotificationService } from './notification.service';
import { AvailabilityService } from './availability.service';
import type { Appointment, AppointmentStatus } from '../types';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
    private supabase = inject(SupabaseService);
    private notify = inject(NotificationService);
    private avail = inject(AvailabilityService);
    appointments = signal<Appointment[]>([]);
    loading = signal(false);
    private channel: any = null;

    async loadForExpert(expertId: string, date?: string) {
        this.loading.set(true);
        let query = this.supabase.client
            .from('appointments')
            .select('*, expert:expert_id(full_name, avatar_url), client:client_id(full_name)')
            .eq('expert_id', expertId)
            .order('appointment_date', { ascending: false })
            .order('start_time', { ascending: false });

        if (date) {
            query = query.eq('appointment_date', date);
        }

        const { data } = await query;
        this.appointments.set(data ?? []);
        this.loading.set(false);
    }

    async loadForClient(clientId: string) {
        this.loading.set(true);
        const { data } = await this.supabase.client
            .from('appointments')
            .select('*, expert:expert_id(full_name, avatar_url, specialty)')
            .eq('client_id', clientId)
            .order('appointment_date', { ascending: false })
            .order('start_time', { ascending: false });
        this.appointments.set(data ?? []);
        this.loading.set(false);
    }

    async loadForRange(expertId: string, dateFrom: string, dateTo: string) {
        this.loading.set(true);
        const { data } = await this.supabase.client
            .from('appointments')
            .select('*, client:client_id(full_name)')
            .eq('expert_id', expertId)
            .gte('appointment_date', dateFrom)
            .lte('appointment_date', dateTo)
            .order('appointment_date', { ascending: true })
            .order('start_time', { ascending: true });
        this.appointments.set(data ?? []);
        this.loading.set(false);
    }

    async checkConflict(expertId: string, date: string, startTime: string, endTime: string): Promise<boolean> {
        const { data } = await this.supabase.client
            .from('appointments')
            .select('id')
            .eq('expert_id', expertId)
            .eq('appointment_date', date)
            .not('status', 'in', '("cancelled","no_show")')
            .or(`start_time.lt.${endTime},end_time.gt.${startTime}`)
            .limit(1);

        return (data?.length ?? 0) > 0;
    }

    async create(data: {
        expert_id: string;
        client_id: string;
        appointment_date: string;
        start_time: string;
        end_time: string;
        notes?: string;
    }) {
        const { appointment_date, start_time } = data;

        const appointmentDate = new Date(appointment_date + 'T' + start_time);
        if (appointmentDate < new Date()) {
            throw new Error('Não é possível agendar para uma data passada.');
        }

        await this.avail.load(data.expert_id);
        const slots = this.avail.slots();
        const dayOfWeek = appointmentDate.getDay();
        const hasSlot = slots.some(s =>
            s.day_of_week === dayOfWeek &&
            s.start_time <= data.start_time &&
            s.end_time >= data.end_time &&
            s.active
        );
        if (!hasSlot) {
            throw new Error('O perito não possui disponibilidade para este horário.');
        }

        const hasConflict = await this.checkConflict(
            data.expert_id, data.appointment_date, data.start_time, data.end_time
        );
        if (hasConflict) {
            throw new Error('Este horário já está agendado. Escolha outro horário.');
        }

        const { data: result, error } = await this.supabase.client
            .from('appointments')
            .insert({
                expert_id: data.expert_id,
                client_id: data.client_id,
                appointment_date: data.appointment_date,
                start_time: data.start_time,
                end_time: data.end_time,
                notes: data.notes ?? null,
            })
            .select()
            .single();

        if (error) throw error;
        return result as Appointment;
    }

    async cancel(id: string, userId: string, reason?: string) {
        const { error } = await this.supabase.client
            .from('appointments')
            .update({
                status: 'cancelled',
                cancelled_by: userId,
                cancellation_reason: reason ?? null,
            })
            .eq('id', id);
        if (error) throw error;
        this.appointments.update(list =>
            list.map(a => a.id === id ? { ...a, status: 'cancelled' as AppointmentStatus } : a)
        );
    }

    async updateStatus(id: string, status: AppointmentStatus) {
        const { error } = await this.supabase.client
            .from('appointments')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
        this.appointments.update(list =>
            list.map(a => a.id === id ? { ...a, status } : a)
        );
    }

    subscribeToUpdates(expertId?: string, clientId?: string) {
        if (this.channel) return;

        let filter = '';
        if (expertId) filter = `expert_id=eq.${expertId}`;
        else if (clientId) filter = `client_id=eq.${clientId}`;

        this.channel = this.supabase.client.channel('appointments')
            .on('postgres_changes' as any,
                { event: 'INSERT', schema: 'public', table: 'appointments', filter },
                (payload: any) => {
                    const newAppt = payload.new as Appointment;
                    this.appointments.update(list => [newAppt, ...list]);
                }
            )
            .on('postgres_changes' as any,
                { event: 'UPDATE', schema: 'public', table: 'appointments', filter },
                (payload: any) => {
                    const updated = payload.new as Appointment;
                    this.appointments.update(list =>
                        list.map(a => a.id === updated.id ? updated : a)
                    );
                }
            )
            .subscribe();
    }

    unsubscribe() {
        if (this.channel) {
            this.supabase.client.removeChannel(this.channel);
            this.channel = null;
        }
    }
}
