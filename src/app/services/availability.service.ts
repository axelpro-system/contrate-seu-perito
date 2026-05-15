import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface TimeSlot {
    id: string;
    expert_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    active: boolean;
}

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
    private supabase = inject(SupabaseService);
    slots = signal<TimeSlot[]>([]);

    getDayLabel(day: number): string { return DAY_LABELS[day] ?? ''; }

    async load(expertId: string) {
        const { data } = await this.supabase.client
            .from('availability')
            .select('*')
            .eq('expert_id', expertId)
            .order('day_of_week')
            .order('start_time');
        this.slots.set(data ?? []);
    }

    async addSlot(expertId: string, dayOfWeek: number, startTime: string, endTime: string) {
        const { error } = await this.supabase.client
            .from('availability')
            .insert({ expert_id: expertId, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime });
        if (error) throw error;
        await this.load(expertId);
    }

    async removeSlot(slotId: string) {
        await this.supabase.client.from('availability').delete().eq('id', slotId);
        this.slots.update(list => list.filter(s => s.id !== slotId));
    }

    async toggleSlot(slotId: string, active: boolean) {
        await this.supabase.client.from('availability').update({ active }).eq('id', slotId);
        this.slots.update(list => list.map(s => s.id === slotId ? { ...s, active } : s));
    }
}
