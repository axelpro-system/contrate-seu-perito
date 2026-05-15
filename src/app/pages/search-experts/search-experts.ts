import { Component, OnInit, OnDestroy, ChangeDetectorRef, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSliderModule } from '@angular/material/slider';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime, takeUntil } from 'rxjs';

const BRAZILIAN_STATES = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const SPECIALTIES = [
    'Perícia Judicial', 'Avaliação de Imóveis', 'Avaliação de Empresas',
    'Perícia Bancária', 'Perícia Tributária', 'Apuração de Haveres',
    'Perícia em Lucros Cessantes', 'Expurgos Inflacionários',
    'Engenharia Civil', 'Medicina do Trabalho', 'Contabilidade',
    'Grafotécnica', 'Perícia Ambiental', 'Perícia Trabalhista',
    'Perícia Previdenciária', 'Perícia Médica', 'Odontologia Legal'
];

@Component({
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule,
        MatButtonModule, MatIconModule, MatCardModule, MatProgressSpinnerModule, MatSliderModule],
    templateUrl: './search-experts.html',
    styleUrl: './search-experts.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchExperts implements OnInit, OnDestroy {
    searchForm: FormGroup;
    orderControl = new FormControl('rating');
    experts = signal<any[]>([]);
    searching = signal(false);
    searched = signal(false);
    error = signal<string | null>(null);
    selectedSpecialty = signal('');
    states = BRAZILIAN_STATES;
    specialtiesList = SPECIALTIES;
    filtersOpen = signal(false);
    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {
        this.searchForm = this.fb.group({
            name: [''],
            specialty: [''],
            state: [''],
            city: [''],
            minRating: [0],
            maxRate: [null],
            orderBy: ['rating'],
        });
    }

    ngOnInit() {
        this.orderControl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(val => {
            this.searchForm.patchValue({ orderBy: val }, { emitEvent: false });
            this.searchExperts();
        });
        setTimeout(() => this.searchExperts(), 0);
    }

    ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); }

    selectSpecialty(specialty: string) {
        this.selectedSpecialty.set(specialty);
        this.searchForm.patchValue({ specialty }, { emitEvent: false });
        this.searchExperts();
        if (window.innerWidth <= 900) this.filtersOpen.set(false);
    }

    onNameInput(value: string) {
        this.searchForm.patchValue({ name: value }, { emitEvent: false });
        this.searchExperts();
    }

    async searchExperts() {
        this.searching.set(true);
        this.error.set(null);
        try {
            const v = this.searchForm.value;
            const location = [v.city, v.state].filter(Boolean).join(', ') || undefined;
            const { data, error } = await this.supabaseService.searchExperts({
                name: v.name || undefined,
                specialty: v.specialty || undefined,
                location: location,
                minRating: v.minRating || undefined,
                maxRate: v.maxRate ? Number(v.maxRate) : undefined,
                orderBy: v.orderBy || 'rating',
            });
            if (error) throw error;
            this.experts.set(data || []);
            this.searched.set(true);
        } catch (err: any) {
            console.error(err);
            this.error.set(err?.message || 'Erro ao buscar peritos.');
            this.searched.set(true);
        } finally {
            this.searching.set(false);
            this.cdr.detectChanges();
        }
    }

    goToExpert(id: string) {
        this.router.navigate(['/expert', id]);
    }

    toggleFilters() {
        this.filtersOpen.set(!this.filtersOpen());
    }
}
