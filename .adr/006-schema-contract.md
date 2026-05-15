# ADR-006: Schema Contract Enforcement

**Status:** Accepted  
**Date:** 2026-05-15  
**Context:** Preventing runtime "column not found" errors

## Decision
- `schema.sql` is the local source of truth for the database schema
- Every migration must be pushed via `supabase db push`
- After every migration, run `NOTIFY pgrst, 'reload schema'` to refresh PostgREST cache
- Frontend components must only reference columns that exist in `schema.sql`

## Rationale
- Multiple "column not found" errors occurred due to schema drift between local and production
- PostgREST caches schema — needs explicit reload after DDL changes
- Explicit column mapping in upserts (no spread of formData) prevents sending unknown fields

## Trade-offs
| Pro | Con |
|-----|-----|
| No runtime column errors | Must maintain schema.sql |
| Explicit data contracts | More verbose upsert code |
| Predictable behavior | — |

## Alternatives Considered
- Let Supabase auto-generate schema — rejected: no local validation
- Use TypeScript types generated from schema — rejected: extra build step, not yet needed

## Consequences
- `upsertProfile()` explicitly maps each field — no `{...formData}` spread
- New columns require: migration → push → schema.sql update → frontend update
- `supabase db pull` should be run periodically (requires Docker)
