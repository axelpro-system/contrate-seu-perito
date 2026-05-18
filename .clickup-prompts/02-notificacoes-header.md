# Feature: Notificações no Header Principal

**Task ClickUp:** Notification Bell no Header

---

## Business Context

**Problema:** Notificações in-app já existem (tabela `notifications`, `NotificationService` com Realtime), mas não há indicador visual no header. Usuários só veem notificações se entrarem no dashboard.

**Métrica:** Aumentar engajamento e tempo de resposta a leads/ mensagens.

**Stack:** Angular 21 (standalone, OnPush), Angular Material, Supabase Realtime

---

## Estado Atual

O `Header` component (`src/app/components/layout/header/header.ts`) já:
- Injeta `NotificationService` como `notifSvc`
- Chama `notifSvc.loadNotifications()` e `notifSvc.subscribe()` no `ngOnInit`
- Tem acesso a `notifSvc.unreadCount()` e `notifSvc.notifications()`

**O que falta:** UI do sino + dropdown no template HTML.

---

## O Que Fazer

### 1. Adicionar NotificationBell no Header Template

**Arquivo:** `src/app/components/layout/header/header.html`

Adicionar ao lado do menu do usuário:

```html
<!-- Dentro do mat-toolbar, antes do menu do usuário -->
@if (isAuthenticated) {
  <button mat-icon-button [matMenuTriggerFor]="notifMenu"
          class="notif-bell"
          [class.has-unread]="notifSvc.unreadCount() > 0"
          (click)="closeMobileMenu()">
    <mat-icon>notifications</mat-icon>
    @if (notifSvc.unreadCount() > 0) {
      <span class="notif-badge">{{ notifSvc.unreadCount() > 99 ? '99+' : notifSvc.unreadCount() }}</span>
    }
  </button>

  <mat-menu #notifMenu="matMenu" class="notif-menu" yPosition="below" [overlapTrigger]="false">
    <!-- Cabeçalho -->
    <div class="notif-header">
      <strong>Notificações</strong>
      @if (notifSvc.unreadCount() > 0) {
        <button mat-button (click)="notifSvc.markAllAsRead()">Marcar todas como lidas</button>
      }
    </div>
    <mat-divider />

    <!-- Loading -->
    @if (notifSvc.notifications().length === 0) {
      <div class="notif-empty">
        <mat-icon>notifications_none</mat-icon>
        <p>Nenhuma notificação</p>
      </div>
    }

    <!-- Lista -->
    @for (n of notifSvc.notifications().slice(0, 10); track n.id) {
      <button mat-menu-item class="notif-item" [class.unread]="!n.read" (click)="openNotification(n)">
        <div class="notif-item-content">
          <div class="notif-title">{{ n.title }}</div>
          @if (n.body) {
            <div class="notif-body">{{ n.body }}</div>
          }
          <div class="notif-time">{{ n.created_at | timeAgo }}</div>
        </div>
        @if (!n.read) {
          <span class="unread-dot"></span>
        }
      </button>
    }

    <!-- Ver todas -->
    @if (notifSvc.notifications().length > 10) {
      <mat-divider />
      <button mat-menu-item disabled>Ver todas as notificações</button>
    }
  </mat-menu>
}
```

### 2. Adicionar método `openNotification()` no Header

```typescript
async openNotification(n: AppNotification) {
  if (!n.read) {
    await this.notifSvc.markAsRead(n.id);
  }
  // Navegar baseado no tipo
  switch (n.type) {
    case 'new_quote':
    case 'quote_response':
      this.router.navigate(['/client-dashboard']);
      break;
    case 'new_message':
      this.router.navigate(['/client-dashboard']); // ou /dashboard se não souber role
      break;
    case 'appointment_scheduled':
    case 'appointment_cancelled':
      this.router.navigate(['/expert-dashboard']); // ajustar por role
      break;
    case 'expert_approved':
      this.router.navigate(['/expert-dashboard']);
      break;
    default:
      // não navega, só fecha o menu
      break;
  }
}
```

### 3. Estilos

**Arquivo:** `src/app/components/layout/header/header.scss`

```scss
.notif-bell {
  position: relative;
  margin-right: 8px;

  &.has-unread mat-icon {
    // Pequena animação ou destaque
  }
}

.notif-badge {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #f44336;
  color: white;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  line-height: 1;
}

.notif-menu {
  min-width: 360px;
  max-width: 400px;
  max-height: 480px;
}

.notif-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;

  strong { font-size: 14px; }
  button { font-size: 12px; }
}

.notif-empty {
  text-align: center;
  padding: 24px 16px;
  color: #999;

  mat-icon { font-size: 40px; width: 40px; height: 40px; margin-bottom: 8px; }
  p { margin: 0; font-size: 13px; }
}

.notif-item {
  height: auto !important;
  padding: 8px 16px !important;
  white-space: normal !important;
  border-bottom: 1px solid #f0f0f0;

  &.unread {
    background: #e3f2fd;
  }
}

.notif-item-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.notif-title {
  font-size: 13px;
  font-weight: 500;
}

.notif-body {
  font-size: 12px;
  color: #666;
  line-height: 1.3;
}

.notif-time {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1976d2;
  flex-shrink: 0;
  margin-left: 8px;
}
```

### 4. Pipe `timeAgo`

Criar `src/app/pipes/time-ago.pipe.ts`:

```typescript
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date): string {
    const now = Date.now();
    const date = new Date(value).getTime();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `há ${minutes} min`;
    if (hours < 24) return `há ${hours}h`;
    if (days < 7) return `há ${days}d`;
    return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }
}
```

---

## Edge Cases

- **0 notificações:** mostrar estado vazio com ícone
- **99+:** badge mostrar "99+"
- **Clique em notificação já lida:** apenas navega, não marca de novo
- **Mobile:** Sino aparece mas dropdown pode ficar cortado — ajustar posição
- **Notificação sem body:** não renderizar linha de body
- **Carregando:** não mostrar nada até `notifications()` ter dados (inicia como array vazio)

---

## Verification

1. Logar como contratante → sino aparece
2. Receber nova cotação → badge aparece em tempo real (Realtime)
3. Abrir dropdown → ver notificações, itens não lidos destacados
4. Clicar em notificação → marca como lida, badge diminui, navega
5. "Marcar todas como lidas" → todas ficam lidas, badge some
6. Logout → sino desaparece
