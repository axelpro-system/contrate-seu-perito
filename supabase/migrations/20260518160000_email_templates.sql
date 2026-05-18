CREATE TABLE IF NOT EXISTS public.email_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    slug text NOT NULL,
    subject text NOT NULL,
    html_body text NOT NULL,
    variables text[] NOT NULL DEFAULT '{}',
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT email_templates_pkey PRIMARY KEY (id),
    CONSTRAINT email_templates_slug_key UNIQUE (slug)
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage email_templates"
    ON public.email_templates FOR ALL
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profile_type = 'ADMIN')
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profile_type = 'ADMIN')
    );

INSERT INTO public.email_templates (slug, subject, html_body, variables) VALUES
('welcome', 'Bem-vindo ao Contrate um Perito!', '<h2>Olá {{name}}!</h2><p>Seja bem-vindo à plataforma.</p>', '{name}'),
('new-lead', 'Você recebeu uma nova solicitação', '<h2>Nova solicitação de {{client_name}}</h2><p>{{message}}</p>', '{client_name,message}'),
('appointment-confirmed', 'Agendamento Confirmado', '<h2>Agendamento confirmado!</h2><p>Data: {{date}} às {{time}} com {{expert_name}}.</p>', '{date,time,expert_name}'),
('password-reset', 'Redefinição de Senha', '<h2>Redefina sua senha</h2><p>Clique no link abaixo para redefinir sua senha.</p>', '{reset_link}')
ON CONFLICT (slug) DO NOTHING;
