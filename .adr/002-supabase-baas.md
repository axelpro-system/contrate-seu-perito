# ADR-002: Supabase as Backend-as-a-Service

**Status:** Accepted  
**Date:** 2026-05-15  
**Context:** Backend architecture decision

## Decision
Use Supabase for:
- PostgreSQL database with Row Level Security (RLS)
- Authentication (email/password + OAuth via Hotmart)
- Storage (avatars, curriculums)
- Realtime subscriptions (chat, notifications)
- Edge Functions (email notifications)

## Rationale
- Single platform covers DB, auth, storage, realtime
- RLS provides security at the database level
- Free tier sufficient for MVP
- PostgreSQL is battle-tested

## Trade-offs
| Pro | Con |
|-----|-----|
| Rapid development | Vendor lock-in |
| Built-in auth + RLS | Limited query complexity on client |
| Realtime out of the box | Cold starts on Edge Functions |

## Alternatives Considered
- Firebase — rejected: NoSQL doesn't fit relational data (quotes, leads, reviews)
- Custom Node.js + Prisma — rejected: More infra to manage, slower MVP
- AWS Amplify — rejected: Higher complexity, steeper learning curve

## Consequences
- All business logic lives in frontend services (QuoteService, etc.)
- RLS policies are the security boundary — must be reviewed on every schema change
- `schema.sql` is the source of truth — must sync after every migration
