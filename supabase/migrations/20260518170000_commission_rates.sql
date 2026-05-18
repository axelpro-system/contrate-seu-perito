CREATE TABLE IF NOT EXISTS public.commission_rates (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    expert_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    percentage numeric NOT NULL DEFAULT 10.0 CHECK (percentage >= 0 AND percentage <= 100),
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT commission_rates_pkey PRIMARY KEY (id),
    CONSTRAINT commission_rates_expert_id_key UNIQUE (expert_id)
);

ALTER TABLE public.commission_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage commission_rates"
    ON public.commission_rates FOR ALL
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profile_type = 'ADMIN'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND profile_type = 'ADMIN'));
