import { Component, OnInit, ChangeDetectorRef, inject, ChangeDetectionStrategy, AfterViewInit, Renderer2 } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
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
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

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
        MatCardModule,
        MatChipsModule,
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
    private titleService = inject(Title);
    private metaService = inject(Meta);
    searchTerm: string = '';
    selectedSpecialty: string = '';
    selectedLocation: string = '';

    specialties = ['Engenharia Civil', 'Medicina', 'Contabilidade', 'Grafotécnica', 'Ambiental'];
    locations = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Brasília, DF'];

    specialtyCounts: { [key: string]: number } = {};
    locationCounts: { [key: string]: number } = {};

    featuredExperts: any[] = [];
    loadingFeatured = true;

    // Depoimentos (prova social) — curados; preparados para futura ligação à tabela reviews
    testimonials: { name: string; role: string; rating: number; quote: string }[] = [
        {
            name: 'Dra. Carolina Mendes',
            role: 'Advogada — Direito Trabalhista',
            rating: 5,
            quote: 'Encontrei um perito contábil em menos de um dia. O parecer foi decisivo para reverter o laudo oficial no processo.'
        },
        {
            name: 'Rafael Antunes',
            role: 'Sócio — Escritório de Engenharia',
            rating: 5,
            quote: 'Plataforma direta ao ponto. Comparei perfis verificados e contratei com segurança, sem depender de indicação informal.'
        },
        {
            name: 'Dra. Patrícia Lopes',
            role: 'Advogada — Cível e Família',
            rating: 5,
            quote: 'A triagem por especialidade e região economizou dias de busca. O assistente técnico entregou um trabalho impecável.'
        }
    ];

    // FAQ — quebra de objeções antes da conversão
    faqs: { question: string; answer: string }[] = [
        {
            question: 'Os peritos são certificados?',
            answer: 'Sim. Os profissionais são certificados pelo IBCAPPA e têm perfil verificado, com formação, especialidades e histórico disponíveis para consulta antes do contato.'
        },
        {
            question: 'Quanto custa contratar um perito?',
            answer: 'O valor é definido diretamente com o profissional, conforme a complexidade da demanda. Você solicita orçamento gratuito e compara propostas antes de decidir.'
        },
        {
            question: 'Em quanto tempo recebo retorno?',
            answer: 'O tempo médio de resposta é de 24h. A solicitação chega ao perito já com o contexto do caso, acelerando a avaliação.'
        },
        {
            question: 'Atende perícias judiciais e extrajudiciais?',
            answer: 'Sim. A plataforma cobre perícias judiciais, extrajudiciais e pareceres técnicos em diversas áreas: engenharia, medicina, contabilidade, grafotécnica, ambiental e outras.'
        },
        {
            question: 'Os peritos atendem em todo o Brasil?',
            answer: 'Sim. Você filtra por estado e cidade para localizar profissionais na sua região, e muitos atuam remotamente em análises documentais.'
        }
    ];

    openFaqIndex: number | null = 0;

    toggleFaq(index: number) {
        this.openFaqIndex = this.openFaqIndex === index ? null : index;
    }

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
        this.titleService.setTitle('Contrate um Perito | IBCAPPA');
        this.metaService.updateTag({ name: 'description', content: 'Contrate peritos judiciais certificados pela IBCAPPA nas áreas de Engenharia, Medicina, Contabilidade, Grafotécnica e muito mais. Plataforma ágil e segura.' });
        this.metaService.updateTag({ property: 'og:title', content: 'Contrate um Perito | IBCAPPA' });
        this.metaService.updateTag({ property: 'og:description', content: 'Encontre peritos especializados de forma ágil e segura.' });
        this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });

        setTimeout(() => this.loadFeaturedExperts(), 0);
    }

    ngAfterViewInit() {
        this.initScrollAnimations();
    }

    normalizeString(str: string): string {
        if (!str) return '';
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
    }

    getMatchedSpecialty(expert: any): string | null {
        const specialty = this.normalizeString(expert.specialty || '');
        const tags = (expert.tags || []).map((t: string) => this.normalizeString(t));
        
        const hasKeyword = (keywords: string[]) => {
            if (keywords.some(k => specialty.includes(k))) return true;
            return tags.some((t: string) => keywords.some(k => t.includes(k)));
        };

        // 1. Engenharia Civil
        if (hasKeyword(['engenharia civil', 'civil', 'engenheiro', 'calculo estrutural', 'patologia'])) {
            return 'Engenharia Civil';
        }
        
        // 2. Medicina
        if (hasKeyword(['medicina', 'medico', 'medica', 'saude', 'ortopedia', 'psiquiatria'])) {
            return 'Medicina';
        }

        // 3. Contabilidade
        if (hasKeyword([
            'contabilidade', 'contador', 'contabil', 'bancaria', 'economista', 
            'tributaria', 'haveres', 'lucros', 'expurgos', 'trabalhista', 'trabalho'
        ])) {
            return 'Contabilidade';
        }

        // 4. Grafotécnica
        if (hasKeyword(['grafotecnica', 'grafotecnico', 'documentoscopia', 'caligrafia', 'escrita'])) {
            return 'Grafotécnica';
        }

        // 5. Ambiental
        if (hasKeyword(['ambiental', 'meio ambiente', 'biologo', 'agronomo', 'agronomia', 'florestal'])) {
            return 'Ambiental';
        }

        return null;
    }

    getMatchedLocation(expert: any): string | null {
        const city = this.normalizeString(expert.city || '');
        const state = this.normalizeString(expert.state || '');

        // Predefined locations
        if (state === 'sp' || city.includes('sao paulo')) {
            return 'São Paulo, SP';
        }
        if (state === 'rj' || city.includes('rio de janeiro')) {
            return 'Rio de Janeiro, RJ';
        }
        if (state === 'mg' || city.includes('belo horizonte')) {
            return 'Belo Horizonte, MG';
        }
        if (state === 'df' || city.includes('brasilia')) {
            return 'Brasília, DF';
        }

        return null;
    }

    async loadFeaturedExperts() {
        this.loadingFeatured = true;
        try {
            // Load dynamic stats and specialty/location counts
            const { data: countData } = await this.supabaseService.getActiveExpertsForCounts();
            
            if (countData) {
                const count = countData.length;
                const peritosStat = this.stats.find(s => s.label === 'Peritos Cadastrados');
                if (peritosStat) {
                    peritosStat.target = Math.max(count, 5); // Fallback minimum 5 for elegant UI representation
                }

                // Reset and pre-populate all count keys with 0
                this.specialties.forEach(spec => this.specialtyCounts[spec] = 0);
                this.locations.forEach(loc => this.locationCounts[loc] = 0);

                // Compute counts
                countData.forEach((expert: any) => {
                    const matchedSpec = this.getMatchedSpecialty(expert);
                    if (matchedSpec) {
                        this.specialtyCounts[matchedSpec] = (this.specialtyCounts[matchedSpec] || 0) + 1;
                    }

                    const matchedLoc = this.getMatchedLocation(expert);
                    if (matchedLoc) {
                        this.locationCounts[matchedLoc] = (this.locationCounts[matchedLoc] || 0) + 1;
                    }
                });
            }

            const { data } = await this.supabaseService.getFeaturedExperts(6);
            this.featuredExperts = (data || []).map((p: any) => ({
                id: p.id,
                name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Perito',
                title: p.specialty || 'Especialista',
                rating: p.rating || 0,
                reviewsCount: p.reviews_count || 0,
                location: [p.city, p.state].filter(Boolean).join(', ') || 'Brasil',
                specialties: p.tags || [],
                hourlyRate: p.hourly_rate ? `R$ ${p.hourly_rate}` : 'Sob consulta',
                avatarUrl: p.avatar_url
            }));
        } catch (err) {
            console.error('Error loading featured experts:', err);
            this.featuredExperts = [];
        } finally {
            this.loadingFeatured = false;
            this.cdr.detectChanges();
            setTimeout(() => this.observeScrollAnimateElements(), 0);
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

    searchBySpecialty(specialty: string) {
        this.selectedSpecialty = specialty;
        this.onSearch();
    }

    private scrollObserver?: IntersectionObserver;

    private initScrollAnimations() {
        if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

        this.scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target as HTMLElement;
                    const delay = el.dataset['delay'] || '0';
                    setTimeout(() => {
                        this.renderer.addClass(el, 'animate-in');
                    }, parseInt(delay));
                    this.scrollObserver?.unobserve(el);

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

        setTimeout(() => this.observeScrollAnimateElements(), 100);
    }

    private observeScrollAnimateElements() {
        if (!this.scrollObserver) return;
        document.querySelectorAll('.scroll-animate:not(.animate-in)').forEach(el => {
            this.scrollObserver!.observe(el);
        });
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
