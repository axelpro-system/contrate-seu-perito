import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';

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
    RouterLink
  ],
  templateUrl: './expert-profile.html',
  styleUrl: './expert-profile.scss'
})
export class ExpertProfile implements OnInit {
  expert: any = null;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private supabaseService: SupabaseService
  ) { }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        const { data, error } = await this.supabaseService.getProfile(id);
        if (error) throw error;
        this.expert = data;
      } catch (error) {
        console.error('Error fetching expert:', error);
      } finally {
        this.loading = false;
      }
    }
  }
}
