# ADR-001: Angular Standalone + Signals + OnPush

**Status:** Accepted  
**Date:** 2026-05-15  
**Context:** Frontend architecture for "Contrate seu Perito"

## Decision
Use Angular 21+ with:
- Standalone components (no NgModules)
- Signals as primary reactive primitive
- `ChangeDetectionStrategy.OnPush` on every component
- `ChangeDetectorRef.detectChanges()` in every async `finally` block

## Rationale
- Standalone reduces boilerplate and improves tree-shaking
- Signals provide fine-grained reactivity without zone.js overhead
- OnPush prevents unnecessary change detection cycles
- The `setTimeout(() => loadData(), 0)` + `cdr.detectChanges()` pattern prevents the "click twice to see data" bug common with OnPush

## Trade-offs
| Pro | Con |
|-----|-----|
| Better performance | Requires manual change detection |
| Less boilerplate | Team must learn Signal patterns |
| Better tree-shaking | No zone.js safety net |

## Alternatives Considered
- NgModules + Zone.js (default Angular) — rejected: more boilerplate, slower
- RxJS-first approach — rejected: Signals are simpler for UI state

## Consequences
- Every new component MUST include `changeDetection: ChangeDetectionStrategy.OnPush`
- Every async data load MUST call `cdr.detectChanges()` in `finally`
- `setTimeout(() => this.loadData(), 0)` in `ngOnInit` is mandatory
