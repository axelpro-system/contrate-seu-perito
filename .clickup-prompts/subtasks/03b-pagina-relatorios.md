# Subtask: Página Admin / Relatórios + Roteamento

**Parent:** Admin Relatórios e Export CSV
**Task ClickUp:** `86e1ej5m3`

## Prompt

Criar página `/admin/reports` com cards de exportação.

### Arquivos:
- `src/app/pages/admin-dashboard/admin-reports.ts`
- `src/app/pages/admin-dashboard/admin-reports.html` (ou template inline)
- `src/app/pages/admin-dashboard/admin-reports.scss`

### Requisitos:

1. **Roteamento:**
   Adicionar em `app.routes.ts`:
   ```typescript
   { path: 'reports', loadComponent: () => import('./pages/admin-dashboard/admin-reports').then(m => m.AdminReports) },
   ```

2. **Admin Layout Sidebar:**
   Adicionar item no menu lateral:
   ```typescript
   { path: '/admin/reports', icon: 'assessment', label: 'Relatórios' }
   ```

3. **Página:**
   - Título: "Relatórios"
   - Seletor de período (mat-select): 7 dias, 30 dias, 90 dias, Todo período
   - Grid de cards (mat-card), um para cada tipo de relatório:
     - Usuários (icon: people)
     - Peritos (icon: verified)
     - Cotações (icon: request_quote)
     - Tickets (icon: support)
     - Agendamentos (icon: calendar_month)
   - Cada card: título, subtítulo, total de registros, botão "Exportar CSV"
   - Botão desabilitado + "Exportando..." durante export
   - `notify.success()` ao completar, `notify.error()` se falhar

4. **Carregar totais:**
   ```typescript
   async ngOnInit() {
     // Usar .select('*', { count: 'exact', head: true }) para contar cada tabela
     // Profiles: total geral + peritos
     // Quotes: total
     // Support tickets: total
     // Appointments: total
   }
   ```

5. **Export:**
   ```typescript
   async exportReport(key: string) {
     this.exporting = key;
     this.cdr.detectChanges();
     try {
       const dates = this.getDateRange();
       switch (key) {
         case 'users': await this.exportSvc.exportUsers(); break;
         case 'experts': await this.exportSvc.exportExperts(); break;
         case 'quotes': await this.exportSvc.exportQuotes(dates.from, dates.to); break;
         case 'tickets': await this.exportSvc.exportTickets(); break;
         case 'appointments': await this.exportSvc.exportAppointments(dates.from, dates.to); break;
       }
       this.notify.success('Exportado com sucesso!');
     } catch (e) {
       this.notify.error('Erro ao exportar.');
     } finally {
       this.exporting = null;
       this.cdr.detectChanges();
     }
   }
   ```

### Estilos:
- Grid de cards: `display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;`
- Card com padding, ícone grande no header
- Total count: fonte grande e negrito
- Botão no final do card (card-actions)

### Edge cases:
- 0 registros → card mostra "0 registros"
- Erro na query → notificação de erro
- Botão duplo clique → desabilitado enquanto exporting
