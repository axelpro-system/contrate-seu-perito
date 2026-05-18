import { Component, OnInit, ChangeDetectorRef, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { SupabaseService } from '../../services/supabase.service';
import { ExpertServiceService, ExpertService, PRICE_UNIT_LABELS } from '../../services/expert-service.service';
import { HireDialog } from '../../components/hire-dialog/hire-dialog';
import { ReviewDialog } from '../../components/review-dialog/review-dialog';
import { AppointmentDialog } from '../../components/appointment-dialog/appointment-dialog';

@Component({
  selector: 'app-expert-profile',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatCardModule, MatIconModule,
    MatDividerModule, RouterLink, MatDialogModule, MatChipsModule, MatTooltipModule
  ],
  templateUrl: './expert-profile.html',
  styleUrl: './expert-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertProfile implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private supabaseService = inject(SupabaseService);
  private expertService = inject(ExpertServiceService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  expert = signal<any>(null);
  reviews = signal<any[]>([]);
  services = signal<ExpertService[]>([]);
  isLoading = signal(true);
  currentUserId = signal<string | null>(null);

  priceUnitLabels = PRICE_UNIT_LABELS;

  averageRating = computed(() => {
    const list = this.reviews();
    if (list.length === 0) return 0;
    return list.reduce((acc, r) => acc + r.rating, 0) / list.length;
  });

  ngOnInit() {
    setTimeout(() => this.loadData(), 0);
  }

  private async loadData() {
    const id = this.route.snapshot.paramMap.get('id');
    await this.checkUserSession();
    if (id) {
      await this.loadExpertProfile(id);
    } else {
      this.isLoading.set(false);
    }
  }

  private async checkUserSession() {
    try {
      const { data: { user } } = await this.supabaseService.getUser();
      this.currentUserId.set(user?.id || null);
    } catch {
      /* no session */
    }
  }

  private safeParse(value: any): any[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value) || []; } catch { return []; }
    }
    return [];
  }

  private async loadExpertProfile(id: string) {
    try {
      this.isLoading.set(true);
      const { data, error } = await this.supabaseService.getProfile(id);
      if (error || !data) {
        this.expert.set(null);
      } else {
        this.expert.set({
          ...data,
          certifications: this.safeParse(data.certifications),
          tags: this.safeParse(data.tags),
        });
        await this.loadReviews(id);
        await this.loadServices(id);
      }
    } catch {
      this.expert.set(null);
    } finally {
      this.isLoading.set(false);
      this.cdr.detectChanges();
    }
  }

  private async loadServices(id: string) {
    await this.expertService.load(id);
    this.services.set(this.expertService.items());
  }

  private async loadReviews(id: string) {
    const { data } = await this.supabaseService.getReviewsForExpert(id);
    this.reviews.set(data || []);
  }

  openAppointmentDialog() {
    const expertData = this.expert();
    const userId = this.currentUserId();
    if (!expertData) return;
    if (!userId) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/expert/${expertData.id}` } });
      return;
    }
    const expertName = expertData.full_name || `${expertData.first_name || ''} ${expertData.last_name || ''}`.trim();
    this.dialog.open(AppointmentDialog, {
      width: '500px',
      data: { expertId: expertData.id, expertName, clientId: userId }
    });
  }

  openHireDialog() {
    const expertData = this.expert();
    const userId = this.currentUserId();
    if (!expertData) return;
    if (!userId) {
      const expertId = expertData.id;
      this.router.navigate(['/login'], { queryParams: { returnUrl: `/expert/${expertId}` } });
      return;
    }
    const expertName = expertData.full_name || `${expertData.first_name || ''} ${expertData.last_name || ''}`.trim();
    this.dialog.open(HireDialog, {
      width: '500px',
      data: { expertId: expertData.id, expertName, clientId: userId }
    });
  }

  openReviewDialog() {
    const expertData = this.expert();
    const userId = this.currentUserId();
    if (!userId || !expertData) return;
    const expertName = expertData.full_name || `${expertData.first_name || ''} ${expertData.last_name || ''}`.trim();
    const dialogRef = this.dialog.open(ReviewDialog, {
      width: '500px',
      data: { expertId: expertData.id, expertName, clientId: userId }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result && expertData.id) this.loadExpertProfile(expertData.id);
    });
  }
}
