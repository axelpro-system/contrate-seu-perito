# Gerenciamento de Estado

## Princípio

**Estado mora onde ele pertence.** Não temos store global; cada serviço de domínio expõe o estado do seu agregado via signals/observables.

## Tipos de estado

| Tipo                       | Onde mora                              | Exemplo                                       |
| -------------------------- | -------------------------------------- | --------------------------------------------- |
| **Servidor (canônico)**    | Postgres (via Supabase)                | Perfis, quotes, mensagens                     |
| **Sessão de auth**         | `AuthService` (signal)                 | Usuário logado, perfil ativo                  |
| **Cache leve**             | Serviço do agregado                    | Catálogo de especialidades                    |
| **UI local**               | Componente                             | Estado de um wizard, abrir/fechar dialog      |
| **Persistente local**      | `localStorage`                         | Tokens JWT (gerido pelo SDK do Supabase)      |

## Padrão por serviço

```ts
@Injectable({ providedIn: 'root' })
export class SpecialtiesService {
  private readonly _specialties = signal<Specialty[] | null>(null);
  readonly specialties = this._specialties.asReadonly();

  constructor(private supa: SupabaseService) {}

  async load(): Promise<void> {
    if (this._specialties() !== null) return;
    const { data, error } = await this.supa.client
      .from('specialties')
      .select('*')
      .eq('active', true)
      .order('label');
    if (error) throw this.supa.normalizeError(error);
    this._specialties.set(data ?? []);
  }

  invalidate(): void {
    this._specialties.set(null);
  }
}
```

- **Signal privado + getter readonly:** consumidores não conseguem mutar.
- **Cache opt-in:** `load()` é idempotente; chamar de novo não refaz a query.
- **Invalidação explícita:** quando admin adiciona especialidade, chama `invalidate()`.

## Quando NÃO criar store global

- Estado usado em uma única página → mantém no componente.
- Listas grandes filtráveis → preferir refetch com filtro do que filtragem cliente.

## Quando considerar store global

Apenas se:

1. ≥ 3 features distintas precisarem do mesmo estado em tempo real,
2. existir lógica de derivação complexa,
3. ou houver coordenação entre múltiplas abas.

Antes de adotar (NgRx, signals store, etc.), registrar **ADR** ([decisions/](../decisions/)).

## AuthService como singleton de sessão

`AuthService` é o único cliente do estado de autenticação:

- Expõe `user` e `profile` como signals.
- Escuta `onAuthStateChange` do Supabase e atualiza signals.
- Guards e páginas leem desses signals, nunca do SDK direto.

## RxJS vs Signals

- **Signals:** estado síncrono, derivado, reativo a UI.
- **RxJS/Observable:** streams contínuos (Realtime, debounce de busca, polling).

Conversão quando necessário:

```ts
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

const specialty$ = toObservable(this.search.specialty);
const messages = toSignal(this.chat.messages$);
```

## Vazamentos de assinatura

- Em componentes que usam `subscribe()`, sempre desinscrever no `ngOnDestroy` (ou usar `takeUntilDestroyed()`).
- Canais Realtime do Supabase: `removeChannel()` no destroy.
- Preferir `async pipe` ou signals para eliminar o problema.
