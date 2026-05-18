# 🎯 Plano — Landing Page v2 (Contrate seu Perito)

## Pesquisa (referências de alta conversão)
Fontes: HubSpot, KlientBoost, Directive Consulting (B2B/serviços), Gandini & Jusbrasil
(landing pages jurídicas — prova social).

**Padrões recorrentes em páginas de alta conversão para serviços profissionais:**
1. Hero com 1 CTA dominante + headline orientada a resultado ✅ (já existe)
2. **Prova social com depoimentos reais** — humaniza e reduz risco percebido (crítico
   no setor jurídico). ❌ ausente
3. Métricas/estatísticas específicas ✅ (já existe)
4. Explicação de processo em poucos passos ✅ (já existe)
5. **FAQ** para neutralizar objeções antes da conversão ❌ ausente
6. Reforço de autoridade/credenciais (selo, certificação) ⚠️ parcial

## Decisão de escopo
Manter a estrutura forte existente e fechar as 2 maiores lacunas de conversão:
- **Seção de Depoimentos** (data-driven, mesma linguagem visual / scroll-animate / OnPush).
- **Seção de FAQ** (acordeão acessível) posicionada antes do CTA final, quebrando
  objeções comuns (custo, prazo, validade jurídica, abrangência).

## Execução
1. `home.ts`: adicionar arrays tipados `testimonials` e `faqs`; estado `openFaqIndex`.
2. `home.html`: inserir `testimonials-section` após `featured-section` e
   `faq-section` antes de `cta-section`.
3. `home.scss`: estilos das duas seções usando tokens existentes ($navy, $gold,
   $green, $muted, sombras), responsivos e com `prefers-reduced-motion`.
4. Build de verificação (`ng build`).

## Invariantes respeitadas
- Sem CRUD direto em componente; dados estáticos curados (preparados p/ futura
  ligação a `reviews` via SupabaseService).
- Implementação completa e tipada, sem placeholders.
