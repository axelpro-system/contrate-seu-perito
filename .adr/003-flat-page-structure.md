# ADR-003: Flat Page Structure (Defer Domain Decomposition)

**Status:** Accepted  
**Date:** 2026-05-15  
**Context:** Project organization

## Decision
Keep `src/app/pages/` flat. Defer decomposition into domain folders (auth/, experts/, clients/, admin/) until proven necessary.

## Rationale
- 1 developer — no team coordination overhead
- ~25 components — manageable without nesting
- Decomposition adds cognitive load without proven pain
- Can reorganize later with simple file moves

## Trade-offs
| Pro | Con |
|-----|-----|
| Simple navigation | Will need refactoring at scale |
| No import path complexity | All pages in one folder |
| Faster feature delivery | — |

## Alternatives Considered
- Domain folders (`src/app/domains/experts/`, etc.) — rejected: premature optimization
- Feature modules — rejected: conflicts with standalone components

## Triggers for Revisit
- New developer joins the team
- Component count exceeds 50
- Feature additions take >2x longer due to scattered files

## Consequences
- New pages go directly in `src/app/pages/`
- Shared components stay in `src/app/components/`
- Services stay in `src/app/services/`
