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
    reviewer_name: string;
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

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed';

export const TICKET_PRIORITY_LABELS: Record<TicketPriority, string> = {
    low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
    open: 'Aberto', in_progress: 'Em Andamento', waiting_client: 'Aguardando Cliente',
    resolved: 'Resolvido', closed: 'Fechado',
};

export interface SupportTicket {
    id: string;
    user_id: string | null;
    subject: string;
    description: string;
    priority: TicketPriority;
    status: TicketStatus;
    assigned_to: string | null;
    created_at: string;
    updated_at: string;
}

export interface TicketMessage {
    id: string;
    ticket_id: string;
    sender_id: string | null;
    message: string;
    is_internal: boolean;
    created_at: string;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    completed: 'Realizado',
    cancelled: 'Cancelado',
    no_show: 'Não Compareceu',
};

export interface Appointment {
    id: string;
    quote_id: string | null;
    expert_id: string;
    client_id: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: AppointmentStatus;
    notes: string | null;
    cancelled_by: string | null;
    cancellation_reason: string | null;
    created_at: string;
    updated_at: string;
    expert?: { full_name?: string; avatar_url?: string; specialty?: string };
    client?: { full_name?: string };
}
