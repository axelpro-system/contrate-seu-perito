import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { QuoteRequestDialog } from '../../components/quote-request-dialog/quote-request-dialog';

@Component({
  selector: 'app-expert-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    RouterLink,
    MatDialogModule, // Added
    MatSnackBarModule // Added
  ],
  templateUrl: './expert-profile.html',
  styleUrl: './expert-profile.scss'
})
export class ExpertProfile implements OnInit {
  expert: any = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const { data, error } = await this.supabaseService.getProfile(id);
        if (error) throw error;
        this.expert = data;
        console.log('Expert loaded:', this.expert);
      } catch (error) {
        console.error('Error fetching expert:', error);
      } finally {
        this.loading = false;
      }
    }
  }

  openQuoteDialog(): void {
    if (!this.expert) return;

    const dialogRef = this.dialog.open(QuoteRequestDialog, {
      data: { expertName: this.expert.full_name },
      width: '500px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === true) {
        this.snackBar.open('Solicitação de cotação enviada com sucesso!', 'Fechar', {
          duration: 5000,
          panelClass: ['snackbar-success']
        });
      }
    });
  }
}