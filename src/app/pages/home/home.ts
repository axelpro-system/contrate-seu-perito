import { Component, OnInit, ChangeDetectorRef, inject, ChangeDetectionStrategy, AfterViewInit, Renderer2 } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { ExpertCard } from '../../components/expert-card/expert-card';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        MatButtonModule,
        MatInputModule,
        MatSelectModule,
        MatFormFieldModule,
        MatIconModule,
        MatProgressSpinnerModule,
        FormsModule,
        ExpertCard
    ],
    templateUrl: './home.html',
    styleUrl: './home.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home implements OnInit, AfterViewInit {
    private supabaseService = inject(SupabaseService);
    private cdr = inject(ChangeDetectorRef);
    private renderer = inject(Renderer2);
    searchTerm: string = '';
    selectedSpecialty: string = '';
    selectedLocation: string = '';

    specialties = ['Engenharia Civil', 'Medicina', 'Contabilidade', 'Grafotécnica', 'Ambiental'];
    locations = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Brasília, DF'];

    featuredExperts: any[] = [];
    loadingFeatured = true;

    // Stats for the stats section
    stats = [
        { value: 0, target: 500, suffix: '+', label: 'Peritos Cadastrados' },
        { value: 0, target: 1200, suffix: '+', label: 'Casos Atendidos' },
        { value: 0, target: 98, suffix: '%', label: 'Satisfação dos Clientes' },
        { value: 0, target: 24, suffix: 'h', label: 'Tempo Médio de Resposta' }
    ];
    statsAnimated = false;

    constructor(private router: Router) { }

    ngOnInit() {
        setTimeout(() => this.loadFeaturedExperts(), 0);
    }

    ngAfterViewInit() {
        this.initScrollAnimations();
    }

    async loadFeaturedExperts() {
        this.loadingFeatured = true;
        try {
            const { data } = await this.supabaseService.client
                .from('profiles')
                .select('*')
                .eq('profile_type', 'PERITO')
                .eq('profile_visible', true)
                .order('rating', { ascending: false })
                .limit(6);
            this.featuredExperts = (data || []).map((p: any) => ({
                id: p.id,
                name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Perito',
                title: p.specialty || 'Especialista',
                rating: p.rating || 0,
                reviewsCount: p.reviews_count || 0,
                location: [p.city, p.state].filter(Boolean).join(', ') || 'Brasil',
                specialties: p.tags || [],
                hourlyRate: p.hourly_rate ? `R$ ${p.hourly_rate}` : 'Sob consulta'
            }));
        } catch (err) {
            console.error('Error loading featured experts:', err);
            this.featuredExperts = [];
        } finally {
            this.loadingFeatured = false;
            this.cdr.detectChanges();
        }
    }

    onSearch() {
        this.router.navigate(['/search'], {
            queryParams: {
                term: this.searchTerm,
                specialty: this.selectedSpecialty,
                location: this.selectedLocation
            }
        });
    }

    private initScrollAnimations() {
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target as HTMLElement;
                    const delay = el.dataset['delay'] || '0';
                    setTimeout(() => {
                        this.renderer.addClass(el, 'animate-in');
                    }, parseInt(delay));
                    observer.unobserve(el);

                    // Trigger stats animation if this is the stats section
                    if (el.classList.contains('stats-section') && !this.statsAnimated) {
                        this.statsAnimated = true;
                        this.animateStats();
                    }
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        setTimeout(() => {
            const elements = document.querySelectorAll('.scroll-animate');
            elements.forEach(el => observer.observe(el));
        }, 100);
    }

    private animateStats() {
        this.stats.forEach((stat, index) => {
            const duration = 2000;
            const startTime = performance.now();
            const startDelay = index * 200;

            setTimeout(() => {
                const animate = (currentTime: number) => {
                    const elapsed = currentTime - startTime - startDelay;
                    const progress = Math.min(elapsed / duration, 1);
                    // Easing: easeOutQuart
                    const easeProgress = 1 - Math.pow(1 - progress, 4);
                    stat.value = Math.round(easeProgress * stat.target);
                    this.cdr.detectChanges();

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    }
                };
                requestAnimationFrame(animate);
            }, startDelay);
        });
    }
}
