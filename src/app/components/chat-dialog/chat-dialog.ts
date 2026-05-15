import { Component, Inject, OnInit, OnDestroy, inject, ChangeDetectorRef, viewChild, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

export interface ChatDialogData {
    quoteId: string;
    otherName: string;
    expertId: string;
    requesterId: string;
}

@Component({
    selector: 'app-chat-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule],
    template: `
    <div class="chat-container">
      <div mat-dialog-title class="chat-header">
        <span>Chat — {{ data.otherName }}</span>
        <button mat-icon-button (click)="dialogRef.close()" aria-label="Fechar chat">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content class="chat-messages" #scrollContainer>
        @if (chat.loading()) {
        <div class="chat-loading">
          <mat-spinner diameter="24"></mat-spinner>
        </div>
        } @else if (chat.messages().length === 0) {
        <div class="chat-empty">
          <mat-icon>chat</mat-icon>
          <p>Nenhuma mensagem ainda. Envie sua primeira mensagem!</p>
        </div>
        }

        <div class="messages-list">
          @for (msg of chat.messages(); track msg.id) {
          <div class="message" [class.message--own]="msg.sender_id === currentUserId">
            <div class="message-bubble">
              {{ msg.content }}
            </div>
            <div class="message-time">
              {{ msg.created_at | date:'dd/MM HH:mm' }}
            </div>
          </div>
          }
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="chat-input" align="end">
        <mat-form-field appearance="outline" class="input-field">
          <input matInput [(ngModel)]="newMessage" (keyup.enter)="send()" placeholder="Digite sua mensagem..." maxlength="1000">
        </mat-form-field>
        <button mat-icon-button color="primary" (click)="send()" [disabled]="!newMessage.trim()" class="send-btn">
          <mat-icon>send</mat-icon>
        </button>
      </mat-dialog-actions>
    </div>
  `,
    styles: [`
    .chat-container { display:flex; flex-direction:column; height:500px; width:420px; max-width:100%; }
    .chat-header { display:flex; justify-content:space-between; align-items:center; padding:16px 24px; margin:0; border-bottom:1px solid #E5E7EB; font-weight:600; font-size:1.1rem; }
    .chat-messages { flex:1; overflow-y:auto; padding:16px 24px; display:flex; flex-direction:column; }
    .chat-loading { display:flex; justify-content:center; padding:40px; }
    .chat-empty { text-align:center; padding:60px 24px; color:#9CA3AF; }
    .chat-empty mat-icon { font-size:48px; width:48px; height:48px; margin-bottom:12px; }
    .messages-list { display:flex; flex-direction:column; gap:12px; }
    .message { display:flex; flex-direction:column; max-width:80%; }
    .message--own { align-self:flex-end; align-items:flex-end; }
    .message:not(.message--own) { align-self:flex-start; align-items:flex-start; }
    .message-bubble { padding:10px 16px; border-radius:16px; font-size:0.95rem; line-height:1.5; word-break:break-word; }
    .message--own .message-bubble { background:#007AFF; color:white; border-bottom-right-radius:4px; }
    .message:not(.message--own) .message-bubble { background:#F3F4F6; color:#1F2937; border-bottom-left-radius:4px; }
    .message-time { font-size:0.7rem; color:#9CA3AF; margin-top:4px; }
    .chat-input { padding:12px 16px; border-top:1px solid #E5E7EB; gap:8px; }
    .input-field { flex:1; margin-bottom:-1.25em; }
    .send-btn { align-self:center; }
  `],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatDialog implements OnInit, OnDestroy {
    chat = inject(ChatService);
    private auth = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);
    scrollContainer = viewChild<ElementRef>('scrollContainer');

    newMessage = '';
    currentUserId: string | null = null;

    constructor(
        public dialogRef: MatDialogRef<ChatDialog>,
        @Inject(MAT_DIALOG_DATA) public data: ChatDialogData,
    ) { }

    async ngOnInit() {
        this.currentUserId = this.auth.userProfile()?.id ?? null;
        await this.chat.loadMessages(this.data.quoteId);
        this.chat.subscribeToMessages(this.data.quoteId);
        this.chat.markAsRead(this.data.quoteId);
        this.scrollToBottom();
    }

    ngOnDestroy() {
        this.chat.unsubscribe();
    }

    async send() {
        if (!this.newMessage.trim()) return;
        const content = this.newMessage.trim();
        this.newMessage = '';
        try {
            await this.chat.sendMessage(this.data.quoteId, content);
            setTimeout(() => this.scrollToBottom(), 100);
        } catch {
            this.newMessage = content;
        }
    }

    private scrollToBottom() {
        setTimeout(() => {
            const el = this.scrollContainer()?.nativeElement;
            if (el) el.scrollTop = el.scrollHeight;
        });
    }
}
