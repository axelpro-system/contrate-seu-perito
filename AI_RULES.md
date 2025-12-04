# Regras de Desenvolvimento e Stack Técnica

Este documento define a stack técnica principal e as regras de uso de bibliotecas para garantir a consistência e manutenibilidade do projeto.

## 1. Resumo da Stack Técnica

*   **Framework:** Angular (utilizando Standalone Components).
*   **Linguagem:** TypeScript.
*   **UI/Componentes:** Angular Material (para todos os elementos de interface padrão).
*   **Estilização:** SCSS (Sass) para estilos globais e específicos de componentes.
*   **Roteamento:** Angular Router.
*   **Gerenciamento de Estado/Backend:** Supabase (utilizado através do `SupabaseService` para Auth e Database).
*   **Formulários:** Angular Reactive Forms (obrigatório para todas as interações de formulário complexas).
*   **Testes:** Vitest (configurado para testes unitários).

## 2. Regras Claras de Uso de Bibliotecas

| Funcionalidade | Biblioteca/Módulo Obrigatório | Regra de Uso |
| :--- | :--- | :--- |
| **Interface do Usuário (UI)** | Angular Material | Use componentes do Angular Material (ex: `MatButton`, `MatCard`, `MatFormField`) para todos os elementos visuais padrão. Não introduza bibliotecas de UI externas. |
| **Estilização** | SCSS | Todos os estilos devem ser escritos em SCSS. Utilize as variáveis e mixins definidos em `src/styles.scss` para cores e tipografia. |
| **Formulários e Validação** | Angular Reactive Forms | Use `FormBuilder`, `FormGroup` e `Validators` para gerenciar o estado e a validação de todos os formulários (Login, Cadastro, Edição). |
| **Backend e Autenticação** | SupabaseService | **Sempre** utilize o `SupabaseService` injetado para interagir com o Supabase (login, registro, busca de perfis, etc.). Nunca chame `createClient` diretamente em componentes. |
| **Navegação** | Angular Router / RouterLink | Use `RouterLink` no HTML para links e o serviço `Router` para navegação programática (ex: após login/cadastro). |
| **Notificações ao Usuário** | MatSnackBar | Use `MatSnackBar` para exibir mensagens de feedback (sucesso, erro, informação) ao usuário. |
| **Estrutura de Arquivos** | Angular Standalone | Mantenha a estrutura de pastas: `src/app/pages/` para rotas principais e `src/app/components/` para componentes reutilizáveis. Todos os componentes devem ser `standalone: true`. |