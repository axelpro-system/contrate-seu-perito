# Subtask: Componente NotificationBell no Header

**Parent:** Notificações no Header Principal
**Task ClickUp:** `86e1ej5fr`

## Prompt

Adicionar sino de notificações com badge e dropdown no header da aplicação.

### Pré-requisitos
O `Header` component já injeta `NotificationService` como `notifSvc` e já chama `loadNotifications()` + `subscribe()` no `ngOnInit`. Os signals `notifSvc.unreadCount()` e `notifSvc.notifications()` já estão disponíveis.

### O que implementar:

1. **No template `header.html`:**
   Adicionar AO LADO do menu do usuário (antes do avatar/nome):
   ```html
   @if (isAuthenticated) {
     <button mat-icon-button [matMenuTriggerFor]="notifMenu"
             class="notif-bell"
             [class.has-unread]="notifSvc.unreadCount() > 0">
       <mat-icon>notifications</mat-icon>
       @if (notifSvc.unreadCount() > 0) {
         <span class="notif-badge">{{ notifSvc.unreadCount() > 99 ? '99+' : notifSvc.unreadCount() }}</span>
       }
     </button>

     <mat-menu #notifMenu="matMenu" class="notif-menu" yPosition="below" [overlapTrigger]="false">
       <div class="notif-header">
         <strong>Notificações</strong>
         @if (notifSvc.unreadCount() > 0) {
           <button mat-button (click)="notifSvc.markAllAsRead()">Marcar todas como lidas</button>
         }
       </div>
       <mat-divider />

       @if (notifSvc.notifications().length === 0) {
         <div class="notif-empty">
           <mat-icon>notifications_none</mat-icon>
           <p>Nenhuma notificação</p>
         </div>
       }

       @for (n of notifSvc.notifications().slice(0, 10); track n.id) {
         <button mat-menu-item [class.unread]="!n.read" (click)="openNotification(n)">
           <div class="notif-item-content">
             <div class="notif-title">{{ n.title }}</div>
             @if (n.body) {
               <div class="notif-body">{{ n.body }}</div>
             }
             <div class="notif-time">{{ timeAgo(n.created_at) }}</div>
           </div>
           @if (!n.read) {
             <span class="unread-dot"></span>
           }
         </button>
       }
     </mat-menu>
   }
   ```

2. **No componente `header.ts`:**
   Adicionar método:
   ```typescript
   async openNotification(n: AppNotification) {
     if (!n.read) {
       await this.notifSvc.markAsRead(n.id);
     }
     switch (n.type) {
       case 'new_quote': case 'quote_response':
         this.router.navigate(['/client-dashboard']); break;
       case 'new_message':
         this.router.navigate(['/dashboard']); break;
       case 'expert_approved':
         this.router.navigate(['/expert-dashboard']); break;
     }
   }

   timeAgo(date: string): string {
     const diff = Date.now() - new Date(date).getTime();
     const mins = Math.floor(diff / 60000);
     const hours = Math.floor(diff / 3600000);
     const days = Math.floor(diff / 86400000);
     if (mins < 1) return 'agora';
     if (mins < 60) return `há ${mins} min`;
     if (hours < 24) return `há ${hours}h`;
     if (days < 7) return `há ${days}d`;
     return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
   }
   ```

3. **No SCSS:**
   - Sino com position relative
   - Badge: absolute, top 2px right 2px, red bg, white text, 10px font, border-radius 50%
   - `.notif-menu`: min-width 360px, max-height 480px
   - `.unread`: background azul claro (#e3f2fd)
   - `.notif-header`: flex, space-between, padding
   - `.notif-empty`: text-align center, padding, gray
   - `.unread-dot`: 8px circle, azul #1976d2
   - `.notif-item-content`: flex column
   - `.notif-title`: 13px, medium weight
   - `.notif-body`: 12px, gray
   - `.notif-time`: 11px, light gray

### Edge cases:
- 0 notificações → "Nenhuma notificação"
- 99+ → badge mostra "99+"
- Notificação sem body → não mostrar linha vazia
- Mobile → dropdown pode ficar cortado, ajustar posição
- Clique em notificação já lida → só navega
