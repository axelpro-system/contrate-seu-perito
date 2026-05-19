# Testes Unitários (Vitest)

## Setup

Vitest está configurado em [package.json](../../package.json#L44) (`"vitest": "^4.0.8"`) + `jsdom` para ambiente DOM.

```bash
npm test                # roda em watch
npm test -- --run       # uma rodada
npm test -- --coverage  # com cobertura
```

Configuração detalhada vive em `vitest.config.ts` (ou inferida do `@angular/build`).

## Estrutura típica

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { QuoteService } from './quote.service';
import { SupabaseService } from './supabase.service';

describe('QuoteService', () => {
  let service: QuoteService;
  let supaMock: any;

  beforeEach(() => {
    supaMock = {
      client: {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn(),
      },
      normalizeError: vi.fn((e) => e),
    };
    TestBed.configureTestingModule({
      providers: [QuoteService, { provide: SupabaseService, useValue: supaMock }],
    });
    service = TestBed.inject(QuoteService);
  });

  it('cria quote com status submitted por padrão', async () => {
    supaMock.client.single.mockResolvedValue({ data: { id: 'q1', status: 'submitted' }, error: null });
    const result = await service.create({
      expertId: 'e1',
      requesterName: 'Carla',
      requesterEmail: 'c@x.com',
      caseDescription: 'caso',
    });
    expect(result.id).toBe('q1');
    expect(supaMock.client.insert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'submitted' }),
    );
  });

  it('propaga erro de RLS como AppError', async () => {
    supaMock.client.single.mockResolvedValue({ data: null, error: { code: '42501', message: 'denied' } });
    await expect(service.create({ /* ... */ } as any)).rejects.toMatchObject({});
    expect(supaMock.normalizeError).toHaveBeenCalled();
  });
});
```

## Testando componentes

```ts
import { TestBed } from '@angular/core/testing';
import { ExpertProfile } from './expert-profile';

describe('ExpertProfile', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ExpertProfile],
      providers: [
        { provide: ExpertService, useValue: { getById: vi.fn().mockResolvedValue(fixtureExpert) } },
      ],
    });
  });

  it('renderiza nome e especialidade', async () => {
    const fixture = TestBed.createComponent(ExpertProfile);
    fixture.componentRef.setInput('id', 'e1'); // se for signal input
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Paulo Silva');
    expect(fixture.nativeElement.textContent).toContain('Grafotécnica');
  });
});
```

## Testando guards

```ts
import { runInInjectionContext } from '@angular/core';
import { authGuard } from './auth.guard';

it('redireciona para /login quando não autenticado', () => {
  const auth = { isAuthenticated: () => false };
  const router = { navigate: vi.fn() };

  const result = runInInjectionContext(injector, () => authGuard(/* route, state */));

  expect(result).toBe(false);
  expect(router.navigate).toHaveBeenCalledWith(['/login']);
});
```

## Padrões

- **Arrange / Act / Assert** explícito.
- **1 expect por it** quando possível (várias expects ok se medem a mesma intenção).
- **`beforeEach` reset.** Cada teste é independente.
- **Fakes > Mocks** quando possível (objeto que se comporta como o real).
- **Nunca mockar o que você está testando.**

## Anti-padrões

- Testar getters/setters triviais.
- Snapshot tests de UI ampla (frágeis). Use snapshot para JSON de saída de função pura.
- `expect.anything()` em todo lugar — vira "teste passa sempre".
- Lógica de produção dentro do teste (testes devem ler de cima para baixo).

## Determinismo

- Não dependa de relógio real → injete `Clock` ou use `vi.useFakeTimers()`.
- Não dependa de rede real → mock total do `SupabaseService`.
- Não dependa de ordem entre testes.

## Cobertura útil

Cobertura é guia, não meta absoluta. Veja [coverage.md](coverage.md).
