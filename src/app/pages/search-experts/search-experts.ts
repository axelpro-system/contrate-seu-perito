import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-search-experts',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        RouterLink
    ],
    templateUrl: './search-experts.html',
    styleUrl: './search-experts.scss'
})
export class SearchExperts implements OnInit {
    searchForm: FormGroup;
    experts: any[] = [];
    loading = false;

    constructor(
        private fb: FormBuilder,
        private supabaseService: SupabaseService
    ) {
        this.searchForm = this.fb.group({
            name: [''],
            specialty: [''],
            city: ['']
        });
    }

    ngOnInit() {
        this.searchExperts();
    }

    async searchExperts() {
        this.loading = true;
        try {
            const filters = this.searchForm.value;
            const { data, error } = await this.supabaseService.searchExperts(filters);

            if (error) throw error;
            this.experts = data || [];
        } catch (error) {
            console.error('Error searching experts:', error);
        } finally {
            this.loading = false;
        }
    }
}
