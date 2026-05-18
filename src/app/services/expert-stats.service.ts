import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface ExpertStats {
  totalLeads: number;
  respondedLeads: number;
  acceptedLeads: number;
  conversionRate: number;
  avgRating: number;
  totalReviews: number;
  reviewDistribution: Record<number, number>;
  totalRevenue: number;
  monthlyRevenue: number;
  leadsByMonth: { month: string; count: number; accepted: number }[];
  avgResponseTimeHours: number;
}

@Injectable({ providedIn: 'root' })
export class ExpertStatsService {
  private supabase = inject(SupabaseService);
  stats = signal<ExpertStats | null>(null);
  loading = signal(false);

  async loadStats(expertId: string) {
    this.loading.set(true);

    const { data: quotes } = await this.supabase.client
      .from('quotes')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false });

    const { data: reviews } = await this.supabase.client
      .from('reviews')
      .select('rating')
      .eq('expert_id', expertId);

    const { data: profile } = await this.supabase.client
      .from('profiles')
      .select('rating, reviews_count')
      .eq('id', expertId)
      .single();

    const totalLeads = quotes?.length ?? 0;
    const respondedLeads = quotes?.filter(q => q.responded_at).length ?? 0;
    const acceptedLeads = quotes?.filter(q => q.status === 'approved').length ?? 0;
    const conversionRate = totalLeads > 0 ? (acceptedLeads / totalLeads) * 100 : 0;

    const allRatings = reviews ?? [];
    const totalReviews = allRatings.length;
    const avgRating = totalReviews > 0
      ? allRatings.reduce((s, r) => s + r.rating, 0) / totalReviews
      : 0;
    const reviewDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    allRatings.forEach(r => { reviewDistribution[r.rating] = (reviewDistribution[r.rating] ?? 0) + 1; });

    const totalRevenue = quotes
      ?.filter(q => q.status === 'approved' && q.proposed_value)
      .reduce((s, q) => s + (q.proposed_value ?? 0), 0) ?? 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthlyRevenue = quotes
      ?.filter(q => q.status === 'approved' && q.proposed_value && q.created_at >= startOfMonth)
      .reduce((s, q) => s + (q.proposed_value ?? 0), 0) ?? 0;

    const leadsByMonth: { month: string; count: number; accepted: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleDateString('pt-BR', { month: 'short' });
      const monthQuotes = quotes?.filter(q => q.created_at?.startsWith(monthKey)) ?? [];
      leadsByMonth.push({
        month: monthLabel,
        count: monthQuotes.length,
        accepted: monthQuotes.filter(q => q.status === 'approved').length,
      });
    }

    const responseTimes = quotes
      ?.filter(q => q.responded_at)
      .map(q => {
        const created = new Date(q.created_at).getTime();
        const responded = new Date(q.responded_at!).getTime();
        return (responded - created) / 3600000;
      }) ?? [];
    const avgResponseTimeHours = responseTimes.length > 0
      ? responseTimes.reduce((s, t) => s + t, 0) / responseTimes.length
      : 0;

    this.stats.set({
      totalLeads, respondedLeads, acceptedLeads,
      conversionRate: Math.round(conversionRate * 10) / 10,
      avgRating: Math.round(avgRating * 10) / 10,
      totalReviews, reviewDistribution,
      totalRevenue, monthlyRevenue,
      leadsByMonth,
      avgResponseTimeHours: Math.round(avgResponseTimeHours * 10) / 10,
    });
    this.loading.set(false);
  }
}
