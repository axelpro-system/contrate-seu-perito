# Subtask: ExportService com geração de CSV

**Parent:** Admin Relatórios e Export CSV
**Task ClickUp:** `86e1ej5jm`

## Prompt

Criar `src/app/services/export.service.ts` com métodos para exportar dados em CSV.

### Métodos:

1. `downloadCSV(data, filename, columns)` — privado
   - Aceita array de objetos, nome do arquivo, definição de colunas
   - Gera CSV com BOM UTF-8 (`\uFEFF`) para acentos no Excel
   - Cria Blob → URL → link `<a>` → click → revoke
   - Escapar aspas duplas nos valores
   - Resolver paths aninhados (`'expert.full_name'` → `obj.expert?.full_name`)

2. `exportUsers()` — nome, email, tipo, status, cidade, estado, data cadastro

3. `exportExperts()` — nome, email, especialidade, cidade, estado, rating, total reviews, valor hora, status

4. `exportQuotes(dateFrom?, dateTo?)` — data, cliente, perito, status, valor, data resposta
   - Aceita filtro opcional de data

5. `exportTickets(status?)` — assunto, status, prioridade, usuário, data abertura, última atualização
   - Aceita filtro opcional de status

6. `exportAppointments(dateFrom?, dateTo?)` — data, início, fim, cliente, perito, status

### Observações:
- Usar `SupabaseService.client` para queries
- Cada método busca dados com `.select()` e `.order()`
- Não precisa de subscribe/observable — usar async/await
- Retornar `void` (dispara download automaticamente)

### Edge cases:
- Array vazio → CSV com apenas cabeçalho
- Valor null/undefined → string vazia no CSV
- Campos com vírgula → escapados com aspas duplas
- Acentos → funcionam graças ao BOM
- Navegador bloqueia popup → não aplica (é download, não popup)
