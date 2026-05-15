# ADR-005: Expert Approval Flow (PENDING Status)

**Status:** Accepted  
**Date:** 2026-05-15  
**Context:** User onboarding and quality control

## Decision
New expert accounts start with `account_status = 'PENDING'` and `profile_visible = false`. Admins must approve before the profile becomes publicly visible.

## Flow
1. Expert registers → `PENDING` + invisible
2. Expert completes onboarding stepper → data saved, still `PENDING`
3. Admin reviews in "Peritos Pendentes" page
4. Admin approves → `ACTIVE` + visible → expert gets email notification
5. Admin rejects → `REJECTED` → expert gets email notification

## Rationale
- Prevents spam/fake accounts from appearing in search
- Ensures quality control of expert profiles
- Admin dashboard has metrics for pending count

## Trade-offs
| Pro | Con |
|-----|-----|
| Quality control | Extra step for experts |
| Spam prevention | Admin bottleneck |
| Email notifications | Requires working email function |

## Alternatives Considered
- Auto-approve all — rejected: no quality control
- Auto-approve with post-moderation — rejected: harder to remove bad actors

## Consequences
- `account_status` enum includes: PENDING, ACTIVE, REJECTED, BLOCKED, SUSPENDED
- `profiles` table has `approved_at` and `approved_by` columns
- `service_completions` table tracks post-service review flow
- RLS policy: public queries only return `ACTIVE` + `profile_visible = true`
