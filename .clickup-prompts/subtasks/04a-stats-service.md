# Subtask: ExpertStatsService com métricas

**Parent:** Dashboard Perito com Estatísticas
**Task ClickUp:** `86e1ej5nh`

## Prompt

Criar `src/app/services/expert-stats.service.ts` que agrega métricas de desempenho do perito.

### Tipos:

```typescript
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
```

### Métodos:

1. `loadStats(expertId: string)` — principal
   - Buscar quotes do perito: `from('quotes').select('*').eq('expert_id', expertId)`
   - Buscar reviews: `from('reviews').select('rating').eq('expert_id', expertId)`
   - Buscar profile: `from('profiles').select('rating, reviews_count').eq('id', expertId).single()`

2. **Cálculos:**
   - `totalLeads` = quotes.length
   - `respondedLeads` = quotes com `responded_at` preenchido
   - `acceptedLeads` = quotes com `status === 'approved'`
   - `conversionRate` = (acceptedLeads / totalLeads) * 100, arredondado 1 casa
   - `avgRating` = média das ratings, arredondado 1 casa
   - `reviewDistribution` = { 1: count, 2: count, ... } baseado nas ratings
   - `totalRevenue` = soma de `proposed_value` de quotes approved
   - `monthlyRevenue` = soma de proposed_value de quotes approved no mês atual
   - `leadsByMonth` = últimos 6 meses, cada mês com total e accepted
   - `avgResponseTimeHours` = média de (responded_at - created_at) em horas

### Edge cases:
- Perito sem quotes → todas métricas zeradas, sem erro
- Perito sem reviews → reviewDistribution vazio, avgRating = 0
- Mês sem leads → barra invisível (count 0)
- Proposta sem valor (null) → não conta na receita
- responseTimes vazio → avgResponseTimeHours = 0
