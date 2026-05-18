# Subtask: Integrar NotificationBell no Layout Principal

**Parent:** Notificações no Header Principal
**Task ClickUp:** `86e1ej5h5`

## Prompt

Esta subtask não requer código novo. Verificar e garantir que:

1. O header component (`src/app/components/layout/header/`) é usado em TODAS as páginas autenticadas
   - Verificar se `app-header` está no layout principal ou em cada página
   - Se estiver faltando em alguma rota, adicionar

2. O NotificationBell (implementado na subtask `02a-notification-bell`) está funcionando em:
   - Desktop e mobile
   - Todas as roles (CONTRATANTE, PERITO, ADMIN)
   - Rotas públicas (sino escondido para não-logados)

3. Testar em mobile:
   - Sino fica acessível no menu hamburguer OU no toolbar
   - Dropdown não quebra o layout

4. Verificar performance:
   - `subscribe()` é chamado uma vez só (não duplicado)
   - Realtime channel é limpo no destroy

### Checklist de verificação:
- [ ] Header aparece em `/client-dashboard` com sino
- [ ] Header aparece em `/expert-dashboard` com sino
- [ ] Header aparece em `/admin` com sino
- [ ] Sino NÃO aparece em `/`, `/login`, `/search` (não logado)
- [ ] Sino funciona em mobile (320px viewport)
- [ ] `ngOnDestroy` limpa subscription se aplicável
