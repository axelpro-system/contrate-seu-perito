CREATE TABLE IF NOT EXISTS public.content_pages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    slug text NOT NULL,
    title text NOT NULL,
    content text NOT NULL DEFAULT '',
    published boolean NOT NULL DEFAULT false,
    updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by uuid REFERENCES public.profiles(id),
    CONSTRAINT content_pages_pkey PRIMARY KEY (id),
    CONSTRAINT content_pages_slug_key UNIQUE (slug)
);

ALTER TABLE public.content_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published pages"
    ON public.content_pages FOR SELECT
    USING (published = true);

CREATE POLICY "Admins can manage content_pages"
    ON public.content_pages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND profile_type = 'ADMIN'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND profile_type = 'ADMIN'
        )
    );

ALTER PUBLICATION supabase_realtime ADD TABLE public.content_pages;

INSERT INTO public.content_pages (slug, title, content, published) VALUES
('how-it-works', 'Como Funciona', '<h2>Para Contratantes</h2><p>Conecte-se ao perito ideal em poucos passos.</p>', true),
('faq', 'Perguntas Frequentes', '<h3>Como funciona a plataforma?</h3><p>Descrição aqui...</p>', true)
ON CONFLICT (slug) DO NOTHING;
