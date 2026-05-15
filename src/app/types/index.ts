export enum ProfileType { PERITO = 'PERITO', CONTRATANTE = 'CONTRATANTE', ADMIN = 'ADMIN' }
export enum AccountStatus { ACTIVE = 'ACTIVE', BLOCKED = 'BLOCKED', PENDING = 'PENDING', REJECTED = 'REJECTED', SUSPENDED = 'SUSPENDED' }
export enum QuoteStatus { SUBMITTED = 'submitted', UNDER_REVIEW = 'under_review', APPROVED = 'approved', REJECTED = 'rejected' }
export enum AvailabilityStatus { AVAILABLE = 'available', BUSY = 'busy', UNAVAILABLE = 'unavailable' }

export const PROFILE_TYPE_LABELS: Record<ProfileType, string> = {
    [ProfileType.PERITO]: 'Perito',
    [ProfileType.CONTRATANTE]: 'Contratante',
    [ProfileType.ADMIN]: 'Administrador',
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
    [AccountStatus.ACTIVE]: 'Ativo',
    [AccountStatus.BLOCKED]: 'Bloqueado',
    [AccountStatus.PENDING]: 'Pendente',
    [AccountStatus.REJECTED]: 'Rejeitado',
    [AccountStatus.SUSPENDED]: 'Suspenso',
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
    [QuoteStatus.SUBMITTED]: 'Pendente',
    [QuoteStatus.UNDER_REVIEW]: 'Em Análise',
    [QuoteStatus.APPROVED]: 'Aceito',
    [QuoteStatus.REJECTED]: 'Recusado',
};

export interface Expert {
    id: string; first_name: string; last_name: string; specialty?: string;
    location?: string; hourly_rate?: number; rating?: number; reviews_count?: number;
    avatar_url?: string; availability_status?: string; bio?: string;
    contact_email?: string; contact_phone?: string; profile_visible?: boolean;
    expertise_areas?: string; certifications?: string; account_status?: AccountStatus;
}

export interface Quote {
    id: string; expert_id: string; requester_id: string | null;
    requester_name: string; requester_email: string; requester_phone: string | null;
    case_description: string; status: QuoteStatus;
    proposed_value: number | null; proposed_deadline: string | null;
    expert_notes: string | null; responded_at: string | null;
    created_at: string; updated_at: string;
}

export interface Profile {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    specialty: string | null;
    bio: string | null;
    certifications: any[] | null;
    contact_email: string | null;
    contact_phone: string | null;
    expertise_areas: string | null;
    rating: number;
    reviews_count: number;
    hourly_rate: number | null;
    availability_status: string;
    profile_visible: boolean;
    profile_type: ProfileType;
    account_status: AccountStatus;
    updated_at: string;
    created_at?: string;
    phone?: string;
    city?: string;
    state?: string;
    social_linkedin?: string;
    social_website?: string;
    cv_url?: string;
    tags?: string[];
    is_verified?: boolean;
    is_featured?: boolean;
    approved_at?: string;
    approved_by?: string;
}

export interface Lead {
    id: string;
    expert_id: string;
    client_id: string;
    message: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface Review {
    id: string;
    expert_id: string;
    client_id: string;
    rating: number;
    comment: string | null;
    lead_id: string | null;
    created_at: string;
}

export interface Specialty {
    id: string;
    label: string;
    active: boolean;
    created_at: string;
}

export interface Certificate {
    id: string;
    profile_id: string;
    name: string;
    issuing_organization: string;
    issue_date: string;
    expiration_date: string | null;
    credential_id: string | null;
    credential_url: string | null;
    description: string | null;
    document_url: string | null;
    created_at: string;
}

export interface AuditLog {
    id: string;
    user_id: string | null;
    action: string;
    details: any;
    created_at: string;
}

export interface ContactSubmission {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    created_at: string;
}
