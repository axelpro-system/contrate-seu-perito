# Subtask: Cards de Métricas + Gráficos no ExpertDashboard

**Parent:** Dashboard Perito com Estatísticas
**Task ClickUp:** `86e1ej5pb`

## Prompt

Adicionar seção de estatísticas no topo do `/expert-dashboard`.

### Dependência:
- `ExpertStatsService` (subtask `04a-stats-service`)

### O que implementar:

1. **Injetar ExpertStatsService** no ExpertDashboard component
   ```typescript
   statsService = inject(ExpertStatsService);
   recentLeads: any[] = [];

   async ngOnInit() {
     await this.auth.initialized;
     const user = this.auth.userProfile();
     if (!user) return;
     await this.statsService.loadStats(user.id);
     await this.loadRecentLeads(user.id);
     this.cdr.detectChanges();
   }

   async loadRecentLeads(expertId: string) {
     const { data } = await this.supabase.client
       .from('quotes')
       .select('requester_name, created_at, status, proposed_value')
       .eq('expert_id', expertId)
       .order('created_at', { ascending: false })
       .limit(5);
     this.recentLeads = data ?? [];
   }
   ```

2. **Adicionar no template** (antes dos cards existentes):

   **Cards de métricas** (grid 4 colunas):
   - Total Leads (ícone: visibility)
   - Taxa Conversão % (ícone: trending_up, cor accent)
   - Avaliação Média (ícone: star)
   - Receita no Mês (ícone: payments, cor accent, formatado BRL)

   **Gráfico de barras** "Leads por Mês":
   - CSS puro (divs com height percentual) — sem dependência externa
   - Barras empilhadas: total (azul) + aceitos (verde)
   - Tooltip com valores nas barras
   - Legenda: Total • Aceitos

   **Tabela "Últimos Leads"**:
   - 5 linhas: Cliente, Data, Status, Valor
   - Botão "Ver todos" → routerLink="/expert/quotes"
   - Estado vazio: "Nenhum lead recebido ainda."

3. **Helper para altura das barras:**
   ```typescript
   maxBarHeight(value: number, all: { count: number }[]): number {
     const max = Math.max(...all.map(m => m.count), 1);
     return (value / max) * 100;
   }
   ```

4. **Filtro de período** (opcional para v1):
   - mat-select: 7d, 30d, 90d, all
   - Ao mudar, recarregar stats

### Estados:
- **Loading:** `<mat-spinner>` centralizado no lugar da seção
- **Dados carregados:** mostrar tudo
- **Erro:** capturar exception no try/catch, mostrar mensagem

### Edge cases:
- 0 leads → "Nenhum lead recebido ainda"
- 0 reviews → rating mostra 0
- Receita zero → R$ 0,00
- Gráfico com todos meses zero → todas barras com altura mínima (4px)
