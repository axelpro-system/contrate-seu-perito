-- ============================================
-- TABELA DE LOGS DE REGISTRO DE PERITOS
-- ============================================

-- Criar tabela de logs de registro
CREATE TABLE IF NOT EXISTS public.expert_registration_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    expert_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status_from text,
    status_to text NOT NULL,
    changed_by uuid REFERENCES public.profiles(id),
    reason text,
    notes text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT expert_registration_logs_pkey PRIMARY KEY (id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_expert_registration_logs_expert_id 
    ON public.expert_registration_logs(expert_id);

CREATE INDEX IF NOT EXISTS idx_expert_registration_logs_status_to 
    ON public.expert_registration_logs(status_to);

CREATE INDEX IF NOT EXISTS idx_expert_registration_logs_created_at 
    ON public.expert_registration_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_expert_registration_logs_changed_by 
    ON public.expert_registration_logs(changed_by);

-- RLS (Row Level Security)
ALTER TABLE public.expert_registration_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Experts can view own logs" 
    ON public.expert_registration_logs 
    FOR SELECT 
    USING (expert_id = auth.uid());

CREATE POLICY "Admins can view all logs" 
    ON public.expert_registration_logs 
    FOR SELECT 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profile_type = 'ADMIN')
    );

CREATE POLICY "System can insert logs" 
    ON public.expert_registration_logs 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Admins can update logs" 
    ON public.expert_registration_logs 
    FOR UPDATE 
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profile_type = 'ADMIN')
    );

-- ============================================
-- COLUNAS NOVAS NA TABELA PROFILES
-- ============================================

-- Adicionar colunas de rastreamento de registro
ALTER TABLE public.profiles 
    ADD COLUMN IF NOT EXISTS registration_status text DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS registration_submitted_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS registration_reviewed_at timestamp with time zone,
    ADD COLUMN IF NOT EXISTS registration_reviewed_by uuid REFERENCES public.profiles(id),
    ADD COLUMN IF NOT EXISTS registration_rejection_reason text,
    ADD COLUMN IF NOT EXISTS registration_notes text;

-- Constraint para valores válidos de status
ALTER TABLE public.profiles 
    DROP CONSTRAINT IF EXISTS valid_registration_status;

ALTER TABLE public.profiles 
    ADD CONSTRAINT valid_registration_status 
    CHECK (registration_status IN ('draft', 'submitted', 'under_review', 'approved', 'rejected'));

-- Índice para busca rápida por status
CREATE INDEX IF NOT EXISTS idx_profiles_registration_status 
    ON public.profiles(registration_status) 
    WHERE profile_type = 'PERITO';

-- ============================================
-- TRIGGER PARA REGISTRAR MUDANÇAS AUTOMATICAMENTE
-- ============================================

-- Função do trigger
CREATE OR REPLACE FUNCTION public.handle_registration_status_change()
RETURNS TRIGGER AS $$
DECLARE
    v_changed_by uuid;
    v_reason text;
BEGIN
    -- Só processar se for perfil de perito
    IF NEW.profile_type != 'PERITO' THEN
        RETURN NEW;
    END IF;

    -- Verificar se o status de registro mudou
    IF OLD.registration_status IS DISTINCT FROM NEW.registration_status THEN
        -- Tentar obter o usuário que fez a mudança (se disponível)
        BEGIN
            v_changed_by := auth.uid();
        EXCEPTION WHEN OTHERS THEN
            v_changed_by := NULL;
        END;

        -- Definir motivo baseado no status
        v_reason := CASE NEW.registration_status
            WHEN 'submitted' THEN 'Cadastro enviado para revisão'
            WHEN 'under_review' THEN 'Cadastro em análise técnica'
            WHEN 'approved' THEN 'Cadastro aprovado pelo administrador'
            WHEN 'rejected' THEN 'Cadastro rejeitado: ' || COALESCE(NEW.registration_rejection_reason, 'Motivo não especificado')
            ELSE 'Status alterado'
        END;

        -- Inserir log
        INSERT INTO public.expert_registration_logs (
            expert_id,
            status_from,
            status_to,
            changed_by,
            reason,
            notes,
            metadata
        ) VALUES (
            NEW.id,
            OLD.registration_status,
            NEW.registration_status,
            v_changed_by,
            v_reason,
            NEW.registration_notes,
            jsonb_build_object(
                'submitted_at', NEW.registration_submitted_at,
                'reviewed_at', NEW.registration_reviewed_at,
                'reviewed_by', NEW.registration_reviewed_by,
                'account_status', NEW.account_status
            )
        );
    END IF;

    -- Atualizar timestamps automaticamente
    IF NEW.registration_status = 'submitted' AND OLD.registration_status != 'submitted' THEN
        NEW.registration_submitted_at := timezone('utc'::text, now());
    END IF;

    IF NEW.registration_status IN ('approved', 'rejected') AND 
       OLD.registration_status NOT IN ('approved', 'rejected') THEN
        NEW.registration_reviewed_at := timezone('utc'::text, now());
    END IF;

    -- Sincronizar com account_status quando aprovado
    IF NEW.registration_status = 'approved' AND OLD.registration_status != 'approved' THEN
        NEW.account_status := 'ACTIVE';
        NEW.profile_visible := true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS trg_registration_status_change ON public.profiles;

CREATE TRIGGER trg_registration_status_change
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_registration_status_change();

-- ============================================
-- FUNÇÃO PARA SUBMETER CADASTRO
-- ============================================

CREATE OR REPLACE FUNCTION public.submit_expert_registration(p_expert_id uuid)
RETURNS boolean AS $$
DECLARE
    v_profile public.profiles%ROWTYPE;
BEGIN
    -- Buscar perfil
    SELECT * INTO v_profile 
    FROM public.profiles 
    WHERE id = p_expert_id AND profile_type = 'PERITO';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil de perito não encontrado';
    END IF;

    -- Verificar se já foi submetido
    IF v_profile.registration_status NOT IN ('draft', 'rejected') THEN
        RAISE EXCEPTION 'Cadastro já foi submetido anteriormente';
    END IF;

    -- Atualizar status
    UPDATE public.profiles 
    SET 
        registration_status = 'submitted',
        registration_submitted_at = timezone('utc'::text, now()),
        account_status = 'PENDING',
        updated_at = timezone('utc'::text, now())
    WHERE id = p_expert_id;

    -- Inserir log inicial
    INSERT INTO public.expert_registration_logs (
        expert_id,
        status_from,
        status_to,
        changed_by,
        reason,
        notes
    ) VALUES (
        p_expert_id,
        v_profile.registration_status,
        'submitted',
        auth.uid(),
        'Cadastro enviado para revisão pelo perito',
        'Documentação submetida para análise da equipe administrativa'
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNÇÃO PARA APROVAR/REJEITAR CADASTRO (ADMIN)
-- ============================================

CREATE OR REPLACE FUNCTION public.review_expert_registration(
    p_expert_id uuid,
    p_approved boolean,
    p_reason text DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_admin_id uuid;
    v_profile public.profiles%ROWTYPE;
BEGIN
    -- Verificar se é admin
    v_admin_id := auth.uid();
    
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = v_admin_id AND profile_type = 'ADMIN'
    ) THEN
        RAISE EXCEPTION 'Apenas administradores podem revisar cadastros';
    END IF;

    -- Buscar perfil do perito
    SELECT * INTO v_profile 
    FROM public.profiles 
    WHERE id = p_expert_id AND profile_type = 'PERITO';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Perfil de perito não encontrado';
    END IF;

    IF v_profile.registration_status != 'submitted' THEN
        RAISE EXCEPTION 'Cadastro não está pendente de revisão';
    END IF;

    -- Atualizar status
    IF p_approved THEN
        UPDATE public.profiles 
        SET 
            registration_status = 'approved',
            registration_reviewed_at = timezone('utc'::text, now()),
            registration_reviewed_by = v_admin_id,
            registration_notes = p_reason,
            account_status = 'ACTIVE',
            profile_visible = true,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_expert_id;
    ELSE
        UPDATE public.profiles 
        SET 
            registration_status = 'rejected',
            registration_reviewed_at = timezone('utc'::text, now()),
            registration_reviewed_by = v_admin_id,
            registration_rejection_reason = p_reason,
            account_status = 'BLOCKED',
            profile_visible = false,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_expert_id;
    END IF;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW PARA RESUMO DE REGISTROS PENDENTES
-- ============================================

CREATE OR REPLACE VIEW public.pending_registrations_view AS
SELECT 
    p.id,
    p.email,
    p.contact_email,
    p.first_name,
    p.last_name,
    p.full_name,
    p.registration_status,
    p.registration_submitted_at,
    p.registration_reviewed_at,
    p.registration_rejection_reason,
    p.specialty,
    p.city,
    p.state,
    (SELECT COUNT(*) FROM public.expert_registration_logs l WHERE l.expert_id = p.id) as log_count
FROM public.profiles p
WHERE p.profile_type = 'PERITO' 
    AND p.registration_status IN ('submitted', 'under_review')
ORDER BY p.registration_submitted_at ASC;

-- Política para view
ALTER VIEW public.pending_registrations_view OWNER TO postgres;

COMMENT ON TABLE public.expert_registration_logs IS 'Registra todo o histórico de mudanças de status do cadastro de peritos';
COMMENT ON COLUMN public.profiles.registration_status IS 'Status do processo de registro: draft, submitted, under_review, approved, rejected';

-- ============================================
-- FUNÇÃO PARA OBTER DADOS DO ÚLTIMO LOG (PARA NOTIFICAÇÃO)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_latest_registration_change(p_expert_id uuid)
RETURNS TABLE (
    status_from text,
    status_to text,
    changed_at timestamp with time zone,
    reason text,
    changed_by_name text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.status_from,
        l.status_to,
        l.created_at as changed_at,
        l.reason,
        COALESCE(admin.full_name, admin.first_name || ' ' || admin.last_name, 'Sistema') as changed_by_name
    FROM public.expert_registration_logs l
    LEFT JOIN public.profiles admin ON admin.id = l.changed_by
    WHERE l.expert_id = p_expert_id
    ORDER BY l.created_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- POLÍTICA PARA PERITOS VEREM PRÓPRIOS LOGS
-- ============================================

CREATE POLICY "Experts can view own registration logs" 
    ON public.expert_registration_logs 
    FOR SELECT 
    USING (expert_id = auth.uid());
