import {
    Component,
    OnInit,
    ChangeDetectorRef,
    inject,
    signal,
    computed,
    ChangeDetectionStrategy
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { SupabaseService } from '../../services/supabase.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

export const SPECIALTIES = [
    'Perícia Judicial',
    'Avaliação de Imóveis',
    'Avaliação de Empresas',
    'Perícia Bancária',
    'Perícia Tributária',
    'Apuração de Haveres',
    'Perícia em Lucros Cessantes',
    'Expurgos Inflacionários',
    'Engenharia Civil',
    'Medicina do Trabalho',
    'Contabilidade',
    'Grafotécnica',
    'Perícia Ambiental',
    'Perícia Trabalhista',
    'Perícia Previdenciária',
    'Perícia Médica',
    'Odontologia Legal'
];

export const STATES = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
    'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
    'RS','RO','RR','SC','SP','SE','TO'
];

export const SPECIALTY_DEMAND = [
    'Perícia Bancária',
    'Perícia Tributária',
    'Avaliação de Empresas',
    'Apuração de Haveres',
    'Perícia em Lucros Cessantes',
    'Expurgos Inflacionários',
    'Perícia em Prestação de Contas',
    'Perícia Atuarial',
    'Perícia Trabalhista',
    'Administração Judicial - Recuperação & Falência',
    'Perícia Grafotécnica',
    'Perícia em Planos de Saúde',
    'Outras perícias'
];

export const WORK_TYPES = [
    'Cálculos para Inicial',
    'Elaboração de Quesitos',
    'Impugnação ao Laudo Pericial',
    'Acompanhamento em diligências',
    'Liquidação de Sentença',
    'Resposta a Quesitos',
    'Perícia Extrajudicial'
];

@Component({
    selector: 'app-expert-profile-edit',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSnackBarModule,
        MatIconModule,
        MatSelectModule,
        MatChipsModule,
        RouterLink,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        MatProgressBarModule,
        MatDividerModule
    ],
    templateUrl: './expert-profile-edit.html',
    styleUrl: './expert-profile-edit.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExpertProfileEdit implements OnInit {
    private fb = inject(FormBuilder);
    private supabaseService = inject(SupabaseService);
    private router = inject(Router);
    private snackBar = inject(MatSnackBar);
    private cdr = inject(ChangeDetectorRef);

    profileForm: FormGroup;
    saving = signal(false);
    loading = signal(true);
    error = signal<string | null>(null);
    userId: string | null = null;

    readonly separatorKeysCodes = [ENTER, COMMA] as const;

    // Chip signals
    tags = signal<string[]>([]);
    certifications = signal<any[]>([]);
    credentialTags = signal<string[]>([]);

    // Clickable list signals
    specialtyDemands = signal<string[]>([]);
    workTypes = signal<string[]>([]);

    // Avatar
    avatarUrl = signal<string | null>(null);
    avatarPreview = signal<string | null>(null);
    uploadingAvatar = signal(false);

    // CV
    cvFileName = signal<string | null>(null);

    // Constants exposed to template
    readonly SPECIALTIES = SPECIALTIES;
    readonly STATES = STATES;
    readonly SPECIALTY_DEMAND = SPECIALTY_DEMAND;
    readonly WORK_TYPES = WORK_TYPES;

    readonly CERTIFICATION_OPTIONS = [
        {
            group: 'Comunidades',
            items: [
                'Comunidade de Perícia Bancária (CPBANC)',
                'Comunidade de Perícia Trabalhista (CPTrab)',
                'Comunidade de Perícia Tributária (CPTrib)',
                'Comunidade de Perícia Previdenciária (CPPrev)'
            ]
        },
        {
            group: 'MBAs',
            items: [
                'MBA em Perícia & Direito Bancário',
                'MBA em Perícia Contábil, Prevenção a Fraudes & Compliance'
            ]
        },
        {
            group: 'Cursos Específicos e Avançados',
            items: [
                'Formação de Peritos Judiciais: do zero à entrega do laudo',
                'Matemática Financeira para Peritos (com Excel)',
                'Cálculos Revisionais para Cartão RMC (curso completo)',
                'Fundo de Comércio – APURAÇÃO DE HAVERES',
                'Fundo de Comércio – VALUATION',
                'Avaliação de Empresas (Valuation na prática)',
                'PeritoGPT: Inteligência Artificial na Perícia',
                'Simples Nacional: uma abordagem na Perícia Contábil',
                'Cálculos Periciais em Ações de Revisão do PASEP',
                'Cálculos Previdenciários em Revisão da Vida Toda',
                'Cálculos Periciais para Ações de Superendividamento',
                'Perícia Contábil em Desapropriação de Imóveis',
                'Perícia Contábil em Perdas, Danos e Lucros Cessantes',
                'Auditoria Contábil & Financeira (curso completo)',
                'Excel para Peritos, Contadores e Profissionais de Finanças',
                'Curso Básico de Excel',
                'LGPD para Peritos',
                'Como Declarar os Rendimentos da Perícia (Judicial e Extrajudicial)',
                'Fundamentos da Perícia Contábil',
                'Fundamentos do Direito Bancário',
                'Perícia em Cheque Especial'
            ]
        }
    ];

    // Computed profile completion percentage
    readonly profileCompletion = computed(() => {
        const f = this.profileForm?.value;
        if (!f) return 0;
        const fields = [
            f.first_name,
            f.last_name,
            f.specialty,
            f.bio,
            f.phone,
            f.city,
            f.state,
            f.hourly_rate,
            f.social_linkedin,
            f.social_website,
            this.avatarUrl() || this.avatarPreview(),
            this.tags().length > 0,
            this.certifications().length > 0
        ];
        const filled = fields.filter(v => !!v).length;
        return Math.round((filled / fields.length) * 100);
    });

    // Computed avatar background string
    readonly avatarBg = computed(() => {
        const src = this.avatarPreview() || this.avatarUrl();
        if (src) return `url(${src})`;
        return 'linear-gradient(135deg, #1a237e 0%, #0d1b2a 100%)';
    });

    constructor() {
        this.profileForm = this.fb.group({
            first_name: ['', Validators.required],
            last_name: [''],
            email: [''],
            specialty: [''],
            bio: [''],
            phone: [''],
            city: [''],
            state: [''],
            hourly_rate: [''],
            availability_status: ['available'],
            social_linkedin: [''],
            social_website: [''],
            cv_url: [''],
            registration_number: [''],
            profile_visible: [true]
        });
    }

    ngOnInit() {
        setTimeout(() => this.initSession(), 0);
    }

    async initSession() {
        try {
            const { data: { session } } = await this.supabaseService.getSession();
            if (!session?.user) {
                this.router.navigate(['/login']);
                return;
            }
            this.userId = session.user.id;
            await this.loadProfile();
        } catch (err) {
            console.error('Error initializing:', err);
            this.error.set('Erro ao carregar sessão.');
        } finally {
            this.loading.set(false);
            this.cdr.detectChanges();
        }
    }

    async loadProfile() {
        if (!this.userId) return;

        const { data: profile, error } = await this.supabaseService.getProfile(this.userId);

        if (error) {
            console.error('Error fetching profile:', error);
            if (error.code !== 'PGRST116') {
                this.error.set('Erro ao carregar perfil.');
            }
        }

        if (profile) {
            // Split first/last name from full_name if individual fields are missing
            let firstName = profile.first_name || '';
            let lastName = profile.last_name || '';
            if (!firstName && !lastName && profile.full_name) {
                const parts = (profile.full_name as string).trim().split(' ');
                firstName = parts[0] || '';
                lastName = parts.slice(1).join(' ') || '';
            }

            this.profileForm.patchValue({
                first_name: firstName,
                last_name: lastName,
                email: profile.email || '',
                specialty: profile.specialty || '',
                bio: profile.bio || '',
                phone: profile.phone || '',
                city: profile.city || '',
                state: profile.state || '',
                hourly_rate: profile.hourly_rate || '',
                availability_status: profile.availability_status || 'available',
                social_linkedin: profile.social_linkedin || '',
                social_website: profile.social_website || '',
                cv_url: profile.cv_url || '',
                registration_number: profile.registration_number || '',
                profile_visible: profile.profile_visible !== false
            });

            this.tags.set(profile.tags || []);
            this.certifications.set(Array.isArray(profile.certifications) ? profile.certifications : []);
            this.credentialTags.set(profile.credential_tags || []);
            this.specialtyDemands.set(profile.specialty_demands || []);
            this.workTypes.set(profile.work_types || []);
            this.avatarUrl.set(profile.avatar_url || null);

            if (profile.cv_url) {
                const parts = (profile.cv_url as string).split('/');
                this.cvFileName.set(parts[parts.length - 1] || 'curriculo.pdf');
            }
        } else {
            const { data: { user } } = await this.supabaseService.getUser();
            const userName = user?.user_metadata?.['full_name'] || '';
            const parts = userName.trim().split(' ');
            this.profileForm.patchValue({
                first_name: parts[0] || '',
                last_name: parts.slice(1).join(' ') || '',
                email: user?.email || ''
            });
        }
    }

    // ── Tag / Expertise chips ─────────────────────────────────────────
    addTag(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();
        if (value && this.tags().length < 10) {
            this.tags.update(tags => [...tags, value]);
        }
        event.chipInput!.clear();
    }

    removeTag(tag: string): void {
        this.tags.update(tags => tags.filter(t => t !== tag));
    }

    // ── Credential chips ──────────────────────────────────────────────
    addCredential(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();
        if (value) {
            this.credentialTags.update(tags => [...tags, value]);
        }
        event.chipInput!.clear();
    }

    removeCredential(cred: string): void {
        this.credentialTags.update(tags => tags.filter(t => t !== cred));
    }

    // ── Certification items ───────────────────────────────────────────
    addCertification(name: string, issuer: string, date: string): void {
        if (!name) return;
        this.certifications.update(certs => [...certs, { name, issuer, date }]);
    }

    removeCertification(index: number): void {
        this.certifications.update(certs => certs.filter((_, i) => i !== index));
    }

    // ── Specialty demand toggle ───────────────────────────────────────
    toggleSpecialty(s: string): void {
        this.specialtyDemands.update(list =>
            list.includes(s) ? list.filter(x => x !== s) : [...list, s]
        );
    }

    isSpecialtySelected(s: string): boolean {
        return this.specialtyDemands().includes(s);
    }

    // ── Work type toggle ──────────────────────────────────────────────
    toggleWorkType(w: string): void {
        this.workTypes.update(list =>
            list.includes(w) ? list.filter(x => x !== w) : [...list, w]
        );
    }

    isWorkTypeSelected(w: string): boolean {
        return this.workTypes().includes(w);
    }

    // ── Avatar upload ─────────────────────────────────────────────────
    async onAvatarSelected(event: any) {
        const file = event.target.files[0];
        if (!file || !this.userId) return;

        if (!file.type.startsWith('image/')) {
            this.snackBar.open('Por favor, selecione uma imagem.', 'Fechar', { duration: 3000 });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            this.snackBar.open('Imagem muito grande. Máximo 2MB.', 'Fechar', { duration: 3000 });
            return;
        }

        const reader = new FileReader();
        reader.onload = (e: any) => {
            this.avatarPreview.set(e.target.result);
            this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);

        this.uploadingAvatar.set(true);
        try {
            const publicUrl = await this.supabaseService.uploadAvatar(this.userId, file);
            this.avatarUrl.set(publicUrl);
            this.avatarPreview.set(null);
            await this.supabaseService.upsertProfile({ id: this.userId, avatar_url: publicUrl });
            this.snackBar.open('Foto atualizada!', 'Fechar', { duration: 2000 });
        } catch (error: any) {
            console.error('Avatar upload error:', error);
            this.snackBar.open('Erro no upload: ' + (error.message || 'Erro desconhecido'), 'Fechar', { duration: 5000 });
            this.avatarPreview.set(null);
        } finally {
            this.uploadingAvatar.set(false);
            event.target.value = '';
            this.cdr.detectChanges();
        }
    }

    removeAvatar() {
        this.avatarUrl.set(null);
        this.avatarPreview.set(null);
        if (this.userId) {
            this.supabaseService.upsertProfile({ id: this.userId, avatar_url: null });
        }
    }

    // ── CV upload ─────────────────────────────────────────────────────
    uploadingCv = signal(false);

    async onCvSelected(event: any) {
        const file = event.target.files[0];
        if (!file || !this.userId) return;

        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            this.snackBar.open('Apenas PDF ou DOC/DOCX são aceitos.', 'Fechar', { duration: 3000 });
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            this.snackBar.open('Arquivo muito grande. Máximo 5MB.', 'Fechar', { duration: 3000 });
            return;
        }

        this.uploadingCv.set(true);
        try {
            const filePath = await this.supabaseService.uploadCv(this.userId, file);
            this.cvFileName.set(file.name);
            this.profileForm.patchValue({ cv_url: filePath });
            await this.supabaseService.upsertProfile({ id: this.userId, cv_url: filePath });
            this.snackBar.open('Currículo enviado!', 'Fechar', { duration: 2000 });
        } catch (error: any) {
            console.error('CV upload error:', error);
            this.snackBar.open('Erro no upload: ' + (error.message || 'Erro desconhecido'), 'Fechar', { duration: 5000 });
        } finally {
            this.uploadingCv.set(false);
            event.target.value = '';
            this.cdr.detectChanges();
        }
    }

    removeCv() {
        this.cvFileName.set(null);
        this.profileForm.patchValue({ cv_url: null });
        if (this.userId) {
            this.supabaseService.upsertProfile({ id: this.userId, cv_url: null });
        }
    }

    // ── Logout ────────────────────────────────────────────────────────
    async logout() {
        await this.supabaseService.signOut();
        this.router.navigate(['/login']);
    }

    // ── Submit ────────────────────────────────────────────────────────
    async onSubmit() {
        if (this.profileForm.invalid || !this.userId) return;

        this.saving.set(true);
        try {
            const formData = this.profileForm.value;
            const fullName = `${formData.first_name || ''} ${formData.last_name || ''}`.trim();

            const profileData: any = {
                id: this.userId,
                first_name: formData.first_name || null,
                last_name: formData.last_name || null,
                full_name: fullName,
                specialty: formData.specialty || null,
                bio: formData.bio || null,
                phone: formData.phone || null,
                city: formData.city || null,
                state: formData.state || null,
                hourly_rate: formData.hourly_rate ? Number(formData.hourly_rate) : null,
                availability_status: formData.availability_status || 'available',
                social_linkedin: formData.social_linkedin || null,
                social_website: formData.social_website || null,
                cv_url: formData.cv_url || null,
                registration_number: formData.registration_number || null,
                profile_visible: formData.profile_visible !== false,
                tags: this.tags(),
                certifications: this.certifications(),
                credential_tags: this.credentialTags(),
                specialty_demands: this.specialtyDemands(),
                work_types: this.workTypes(),
                avatar_url: this.avatarUrl(),
                updated_at: new Date().toISOString(),
            };

            const { error, data } = await this.supabaseService.upsertProfile(profileData);
            if (error) {
                console.error('Supabase upsert error:', error);
                throw error;
            }

            this.snackBar.open('Perfil salvo com sucesso!', 'Fechar', { duration: 3000 });
            this.router.navigate(['/expert-dashboard']);
        } catch (error: any) {
            console.error('Error saving profile:', error);
            this.snackBar.open('Erro: ' + error.message, 'Fechar', { duration: 5000 });
        } finally {
            this.saving.set(false);
            this.cdr.detectChanges();
        }
    }
}
