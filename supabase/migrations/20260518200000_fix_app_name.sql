UPDATE public.email_templates
SET subject = REPLACE(subject, 'Contrate seu Perito', 'Contrate um Perito'),
    html_body = REPLACE(html_body, 'Contrate seu Perito', 'Contrate um Perito')
WHERE subject LIKE '%Contrate seu Perito%' OR html_body LIKE '%Contrate seu Perito%';
