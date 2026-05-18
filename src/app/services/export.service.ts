import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private supabase = inject(SupabaseService);

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((o, key) => o?.[key], obj);
  }

  private downloadCSV(data: Record<string, any>[], filename: string, columns: { key: string; label: string }[]) {
    const header = columns.map(c => c.label).join(',');
    const rows = data.map(row =>
      columns.map(c => {
        const val = this.getNestedValue(row, c.key) ?? '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',')
    );
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async exportUsers(filters?: { type?: string; status?: string }) {
    let query = this.supabase.client
      .from('profiles')
      .select('id, full_name, email, profile_type, account_status, city, state, updated_at')
      .order('updated_at', { ascending: false });

    if (filters?.type) query = query.eq('profile_type', filters.type);
    if (filters?.status) query = query.eq('account_status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return;

    this.downloadCSV(data, 'usuarios', [
      { key: 'full_name', label: 'Nome' },
      { key: 'email', label: 'Email' },
      { key: 'profile_type', label: 'Tipo' },
      { key: 'account_status', label: 'Status' },
      { key: 'city', label: 'Cidade' },
      { key: 'state', label: 'Estado' },
      { key: 'updated_at', label: 'Última Atualização' },
    ]);
  }

  async exportExperts() {
    let query = this.supabase.client
      .from('profiles')
      .select('id, full_name, email, specialty, city, state, rating, reviews_count, hourly_rate, account_status, updated_at')
      .eq('profile_type', 'PERITO')
      .order('updated_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return;

    this.downloadCSV(data, 'peritos', [
      { key: 'full_name', label: 'Nome' },
      { key: 'email', label: 'Email' },
      { key: 'specialty', label: 'Especialidade' },
      { key: 'city', label: 'Cidade' },
      { key: 'state', label: 'Estado' },
      { key: 'rating', label: 'Avaliação' },
      { key: 'reviews_count', label: 'Total Avaliações' },
      { key: 'hourly_rate', label: 'Valor Hora' },
      { key: 'account_status', label: 'Status' },
      { key: 'updated_at', label: 'Última Atualização' },
    ]);
  }

  async exportQuotes(dateFrom?: string, dateTo?: string) {
    let query = this.supabase.client
      .from('quotes')
      .select('created_at, requester_name, requester_email, status, proposed_value, responded_at')
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo) query = query.lte('created_at', dateTo);

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return;

    this.downloadCSV(data, 'cotacoes', [
      { key: 'created_at', label: 'Data' },
      { key: 'requester_name', label: 'Cliente' },
      { key: 'requester_email', label: 'Email' },
      { key: 'status', label: 'Status' },
      { key: 'proposed_value', label: 'Valor Proposto' },
      { key: 'responded_at', label: 'Data Resposta' },
    ]);
  }

  async exportTickets(status?: string) {
    let query = this.supabase.client
      .from('support_tickets')
      .select('subject, status, priority, user:user_id(full_name, email), created_at, updated_at')
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return;

    this.downloadCSV(data, 'tickets', [
      { key: 'subject', label: 'Assunto' },
      { key: 'status', label: 'Status' },
      { key: 'priority', label: 'Prioridade' },
      { key: 'user.full_name', label: 'Usuário' },
      { key: 'created_at', label: 'Data Abertura' },
      { key: 'updated_at', label: 'Última Atualização' },
    ]);
  }

  async exportAppointments(dateFrom?: string, dateTo?: string) {
    let query = this.supabase.client
      .from('appointments')
      .select('appointment_date, start_time, end_time, client:client_id(full_name), expert:expert_id(full_name), status, created_at')
      .order('created_at', { ascending: false });

    if (dateFrom) query = query.gte('appointment_date', dateFrom);
    if (dateTo) query = query.lte('appointment_date', dateTo);

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return;

    this.downloadCSV(data, 'agendamentos', [
      { key: 'appointment_date', label: 'Data' },
      { key: 'start_time', label: 'Início' },
      { key: 'end_time', label: 'Fim' },
      { key: 'client.full_name', label: 'Cliente' },
      { key: 'expert.full_name', label: 'Perito' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Data Criação' },
    ]);
  }
}
