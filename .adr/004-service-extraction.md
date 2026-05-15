# ADR-004: Service Extraction Pattern

**Status:** Accepted  
**Date:** 2026-05-15  
**Context:** Code organization and separation of concerns

## Decision
Extract domain-specific services from `SupabaseService`:
- `QuoteService` — quote CRUD, status transitions
- `HotmartService` — OAuth flow, CSRF validation
- `FormService` — form creation, validation, sanitization
- `CademiService` — course platform integration
- `ChatService` — message CRUD, realtime subscriptions
- `NotificationService` — toast notifications
- `LeadNotificationService` — unread count, real-time alerts

`SupabaseService` remains as:
- Supabase client wrapper
- Profile CRUD
- Storage operations (uploadAvatar, uploadCv)
- Admin stats aggregation

## Rationale
- Single `SupabaseService` was becoming a God class (200+ lines)
- Domain services make business logic explicit and testable
- Hotmart/CSRF logic is security-critical and deserves isolation

## Trade-offs
| Pro | Con |
|-----|-----|
| Clearer ownership | More files to navigate |
| Easier to test | Cross-service dependencies |
| Security logic isolated | — |

## Alternatives Considered
- Keep everything in SupabaseService — rejected: God class anti-pattern
- Use NestJS-style modules — rejected: overkill for Angular standalone

## Consequences
- New domain logic goes in its own service
- SupabaseService stays thin (client wrapper + profile ops)
- Services inject each other via Angular DI
