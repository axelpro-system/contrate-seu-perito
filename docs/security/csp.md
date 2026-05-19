# Content Security Policy (proposta)

CSP restritivo reduz superfície de XSS, clickjacking e injeção. Ainda não temos um — esta página é a especificação alvo.

## Política inicial sugerida

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https://*.supabase.co https://*.supabase.in;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cademi.com.br https://api.hotmart.com;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
  report-uri /csp-report;
```

> Material Icons fonts e Google Fonts são incluídos. Se você self-hospedar fontes, pode remover `fonts.googleapis.com`/`fonts.gstatic.com`.

## Headers adicionais

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

## Onde configurar

Depende do host:

- **Cloudflare Pages:** arquivo `_headers` na raiz do build.
- **Netlify:** `_headers` ou `netlify.toml`.
- **Vercel:** `vercel.json`.
- **S3 + CloudFront:** Functions ou Response Headers Policy.

## Trade-offs com `style-src 'unsafe-inline'`

Angular Material aplica estilos inline via Angular CDK. Remover `'unsafe-inline'` exigiria configuração avançada. Trade-off aceitável em V1.

## Como rolar gradualmente

1. **Report-Only primeiro:**
   ```
   Content-Security-Policy-Report-Only: ...
   ```
   Captura violações sem bloquear.
2. **Analisar relatórios** por 1-2 semanas.
3. Ajustar policy.
4. Trocar para `Content-Security-Policy` enforce.

## Endpoint de report

`POST /csp-report` precisa de um receptor (Edge Function ou serviço externo). Em V1 pode-se omitir o `report-uri`.

## Verificação

- [securityheaders.com](https://securityheaders.com) — nota A+ é o alvo.
- [csp-evaluator](https://csp-evaluator.withgoogle.com) — análise da política.
- DevTools → Console → erros de CSP.

## Riscos a observar

- Bibliotecas que injetam scripts inline (analytics, chat widget) precisam de exceção controlada (`nonce` ou hash).
- Iframe externo (sempre exigir `frame-src` explícito; default é `frame-src 'none'`).
- `eval`/`Function('...')` quebram com CSP padrão; bibliotecas modernas não usam.
