# ⚖️ Relatório Técnico & Estético: Landing Page (Contrate seu Perito)

Este documento apresenta uma análise aprofundada da **Landing Page (Página Inicial)** da plataforma **Contrate seu Perito**, abordando seus fundamentos de design (*Design System*), sua arquitetura técnica no Angular 21, a lógica de integração de dados em tempo real com o Supabase, e as micro-interações de ponta que criam uma experiência premium.

---

## 🎨 1. Estética Premium e Design System (Visual Excellence)

A interface foi projetada para inspirar **confiança jurídica, credibilidade técnica e sofisticação**, afastando-se de layouts genéricos por meio de escolhas harmônicas e elegantes.

### 🔴 Paleta de Cores e Contraste
*   **Azul Marinho Escuro/Profundo (`#0F1729`, `#0F172A`):** Cor predominante que atua como o alicerce visual. Evoca seriedade, autoridade e profissionalismo (atributos fundamentais para o setor pericial e jurídico).
*   **Âmbar e Dourado (`#D97706`, `#B45309`, `#FBBF24`):** Utilizados estrategicamente como cores de destaque para chamar a atenção do usuário para elementos cruciais: botões de CTA, badges de validação e estrelas de avaliação.
*   **Gama de Cinzas Slate (`#F8FAFC` a `#334155`):** Aplicada com precisão em textos, bordas sutis e divisores de conteúdo para garantir legibilidade impecável e conforto visual.
*   **Gradients Ambientais:** O topo do site (Hero) utiliza gradientes radiais suaves e profundos, combinando o azul e toques de âmbar, eliminando "blobs" decorativos infantis para manter uma sobriedade refinada.

### ✍️ Tipografia Curada
*   **Serifa Acadêmica (`'EB Garamond'`, Georgia):** Utilizada no título principal (H1) e nos títulos de seção (H2 e H3). Cria uma atmosfera refinada, intelectual e de prestígio tradicional.
*   **Interface Limpa (`'Lato'`, Sans-serif):** Utilizada para textos de apoio, inputs, seletores, botões e elements de controle (UI). Facilita a leitura dinâmica e a usabilidade em qualquer tamanho de tela.

### 🧊 Efeitos e Elevação
*   **Sombras e Glassmorphism:** O painel de busca da seção Hero utiliza um sutil efeito de translucidez em fundo branco com bordas arredondadas e sombra suave de elevação média (`shadow-md`).
*   **Micro-Elevações:** Cards de peritos e recursos se elevam suavemente no eixo Z (`transform: translateY(-4px)`) ao passar o mouse, alterando cores de ícones e aplicando profundidade física sutil.

---

## 🏗️ 2. Arquitetura de Componentes (Angular 21)

A landing page está mapeada para a rota raiz (`/`) e é implementada de forma modular e independente na classe [Home](file:///c:/Users/ibcap/dyad-apps/Contrate-seu-perito/src/app/pages/home/home.ts) (`standalone: true`).

### 🗺️ Organização Geral do Layout
O componente global `App` ([app.ts](file:///c:/Users/ibcap/dyad-apps/Contrate-seu-perito/src/app/app.ts) and [app.html](file:///c:/Users/ibcap/dyad-apps/Contrate-seu-perito/src/app/app.html)) envolve as rotas em um template comum contendo a barra de navegação superior (`<app-header>`) e o rodapé institucional (`<app-footer>`), garantindo consistência visual em todas as páginas do sistema.

### 📐 Seções Estruturais da Landing Page
1.  **Hero Section:** O ponto focal de conversão com selo de verificação "Certificado IBCAPPA", título persuasivo de alta estatura, subtítulo conciso e o **Card de Busca Central**.
2.  **Busca Centralizada:** Três seletores de alta usabilidade para consultas rápidas:
    *   Input de texto livre (`"O que você precisa?"`) para digitar especialidades ou termos gerais.
    *   Dropdown de Especialidade (valores como *Engenharia Civil, Medicina, Contabilidade, Grafotécnica, Ambiental*).
    *   Dropdown de Localização (filtrado pelos estados principais).
    *   Ação de busca que envia os dados filtrados como `queryParams` diretamente para a página `/search`.
3.  **Seção de Estatísticas (Stats Section):** Uma faixa minimalista cinza que exibe números expressivos de sucesso da marca, impulsionados por uma animação numérica fluida.
4.  **Seção "Como Funciona" (How it Works):** Linha do tempo visual de 3 etapas com ícones e indicadores de conexão que explicam de forma clara e simples as ações de "Busque", "Solicite" e "Contrate".
5.  **Peritos em Destaque:** Apresenta uma grid contendo os peritos mais bem classificados. Utiliza o subcomponente dedicado e reutilizável `<app-expert-card>` ([expert-card.ts](file:///c:/Users/ibcap/dyad-apps/Contrate-seu-perito/src/app/components/expert-card/expert-card.ts)).
6.  **Seção "Por que nós" (Features Section):** Exibição em quatro colunas de diferenciais competitivos: profissionais verificados, facilidade de uso, proteção de dados e suporte dedicado.
7.  **CTA de Conversão Dupla (Call to Action):** Seção inferior com dois botões para converter os dois perfis da plataforma: clientes em busca de ajuda e novos profissionais querendo se cadastrar.

---

## ⚡ 3. Conectividade de Dados (Supabase Integration)

A página carrega dinamicamente registros de peritos reais diretamente do banco de dados na inicialização, garantindo que o conteúdo esteja sempre atualizado.

```typescript
async loadFeaturedExperts() {
    this.loadingFeatured = true;
    try {
        const { data } = await this.supabaseService.client
            .from('profiles')
            .select('*')
            .eq('profile_type', 'PERITO')
            .eq('profile_visible', true)
            .order('rating', { ascending: false })
            .limit(6);
        this.featuredExperts = (data || []).map((p: any) => ({
            id: p.id,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Perito',
            title: p.specialty || 'Especialista',
            rating: p.rating || 0,
            reviewsCount: p.reviews_count || 0,
            location: [p.city, p.state].filter(Boolean).join(', ') || 'Brasil',
            specialties: p.tags || [],
            hourlyRate: p.hourly_rate ? `R$ ${p.hourly_rate}` : 'Sob consulta'
        }));
    } catch (err) {
        console.error('Error loading featured experts:', err);
        this.featuredExperts = [];
    } finally {
        this.loadingFeatured = false;
        this.cdr.detectChanges();
    }
}
```

### 🔐 Detalhes da Integração
*   **Filtros de Negócio:** Filtra a tabela `profiles` para garantir que apenas perfis do tipo `'PERITO'` e marcados como visíveis (`profile_visible = true`) apareçam nos destaques.
*   **Ordenação Inteligente:** Os profissionais mais bem avaliados (`rating` decrescente) aparecem prioritariamente, incentivando a alta qualidade dos serviços.
*   **Mapeamento Flexível:** Trata campos ausentes aplicando padrões inteligentes (ex: exibe *"Sob consulta"* se o valor da hora não estiver preenchido).
*   **Integração de Favoritos:** O card possui um ícone de coração integrado ao `FavoriteService` para gerenciar a lista de peritos favoritos do cliente localmente ou no banco.

---

## ✨ 4. Micro-Interações e Animações Dinâmicas

A página conta com soluções de animação refinadas que dão dinamismo sem afetar negativamente o processamento ou bateria do usuário.

### 👁️ Animações de Scroll Interativas
A página inicial utiliza a moderna API de `IntersectionObserver` do navegador para carregar elementos à medida que o usuário rola a página:
*   Os elementos que possuem a classe `.scroll-animate` começam ocultos (`opacity: 0`) e ligeiramente deslocados para baixo (`translateY(24px)`).
*   Quando entram na área de visualização do navegador (com limite de detecção de `0.1`), o script do Angular adiciona a classe `.animate-in`, disparando uma transição CSS baseada em uma curva de velocidade premium e natural (`cubic-bezier(0.22, 1, 0.36, 1)`).
*   **Acessibilidade respeitada:** Através da diretiva `@media (prefers-reduced-motion: reduce)`, todas as transições de deslocamento são desativadas caso o usuário possua restrições a movimentos rápidas no sistema operacional.

### 🔢 Contadores Dinâmicos Inteligentes
Ao rolar a página e cruzar a seção de estatísticas, um script dinâmico é ativado:
*   Os números das estatísticas sobem progressivamente a partir de `0` até o seu alvo final (ex: de `0` a `500+`).
*   Utiliza a API nativa `requestAnimationFrame` para calcular a renderização dos números de forma síncrona com a taxa de atualização da tela do usuário.
*   Aplica uma curva de atenuação matemática (`easeOutQuart`) que faz com que os números subam rapidamente no início e desacelerem suavemente no final da animação, criando um efeito sofisticado.

---

## 🚀 5. Performance e Melhores Práticas

A página é extremamente performática graças a decisões arquiteturais modernas:
1.  **ChangeDetectionStrategy.OnPush:** Configurado na página [Home](file:///c:/Users/ibcap/dyad-apps/Contrate-seu-perito/src/app/pages/home/home.ts) e no subcomponente [ExpertCard](file:///c:/Users/ibcap/dyad-apps/Contrate-seu-perito/src/app/components/expert-card/expert-card.ts). Isso instrui o Angular a rodar as verificações de alteração de dados apenas se as propriedades de entrada (`@Input`) ou eventos explícitos forem disparados. Reduz drasticamente o overhead de renderização.
2.  **Diretiva Modernas de Loop (@for):** Utiliza a nova sintaxe nativa do Angular 17+ (`@for ... track`) no lugar de `*ngFor` antigos. Isso melhora consideravelmente o rastreamento dos itens da grid e otimiza a manipulação do DOM.
3.  **Acessibilidade Semântica:** Uso correto de tags semânticas da especificação do HTML5 (`<main>`, `<section>`, `<h1>`, `<header>`, etc.) e vinculação de rótulos através de IDs únicos para leitores de tela.

---

## 📈 6. Oportunidades de Otimização e Evolução

Apesar do nível extremamente alto de entrega visual e técnica, identificamos as seguintes melhorias para futuras iterações:
1.  **Otimização de Imagens:** Implementar carregamento tardio (*lazy-loading*) ou componentes de imagem inteligentes para as fotos de perfil de peritos na grid de destaque.
2.  **Metatags de SEO Dinâmicas:** Injetar títulos e descrições personalizadas no cabeçalho HTML da página usando a biblioteca `Meta` do Angular para otimizar o rankeamento no Google.
3.  **Filtros de Busca Reais:** Conectar as buscas do cabeçalho de pesquisa diretamente a contadores dinâmicos de resultados para que o usuário saiba de antemão quantos peritos existem em determinada região antes de clicar em buscar.
