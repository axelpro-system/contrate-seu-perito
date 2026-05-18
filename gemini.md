# 🚀 Project Constitution & Data Law - Contrate seu Perito

## 📌 Metadata & Context
- **Project Name:** Contrate seu Perito
- **Tech Stack:** Angular (Frontend), Supabase (Backend/Database)
- **Role:** System Pilot (A.N.T. Protocol)
- **Status:** Dynamic Landpage Optimizations Completed & Verified

---

## 🗄️ Database Schemas & Data Model

### 1. Table: `reviews`
Stores client-submitted evaluations for peritos.
```sql
CREATE TABLE public.reviews (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    expert_id uuid NOT NULL REFERENCES public.profiles(id),
    client_id uuid NULL REFERENCES public.profiles(id),
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text NULL,
    reviewer_name text NOT NULL,
    lead_id uuid NULL REFERENCES public.leads(id),
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT reviews_pkey PRIMARY KEY (id)
);
```

### 2. Table: `profiles`
Stores user profile information, covering both clients and peritos.
```sql
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text NULL,
    last_name text NULL,
    full_name text NULL,
    role text NOT NULL DEFAULT 'client'::text,
    profile_type text DEFAULT 'CLIENTE'::text, -- 'PERITO' or 'CLIENTE'
    profile_visible boolean DEFAULT true,
    account_status text DEFAULT 'ACTIVE'::text, -- 'ACTIVE', 'SUSPENDED'
    specialty text NULL,
    tags text[] NULL,
    city text NULL,
    state text NULL,
    avatar_url text NULL,
    rating numeric(3,2) DEFAULT 0.00,
    reviews_count integer DEFAULT 0,
    hourly_rate numeric NULL,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
```

---

## ⚙️ Behavioral Rules & Constraints

1. **Reviewer Name Integrity (Not Null Constraint)**:
   - When creating a review via `createReview()`, the service layer must asynchronously fetch the client profile details using their `client_id`.
   - The field `reviewer_name` must be composed from the profile name (`full_name` or `first_name + last_name`).
   - If the profile fetching fails or the name fields are empty, a robust fallback value of `'Cliente'` must be applied to prevent violating the database not-null constraint.

2. **Supabase Isolation & Encapsulation**:
   - All backend-related services must reside in `SupabaseService` ([supabase.service.ts](file:///c:/Users/ibcap/dyad-apps/Contrate-seu-perito/src/app/services/supabase.service.ts)).
   - Client components and page components must interact via service methods and must not perform direct CRUD actions using the raw PostgREST client.

3. **No Code Placeholders**:
   - All implementations must be fully production-ready, typed, and complete. No `TODO`s or unfinished blocks.

---

## 🏛️ Architectural Invariants

- **ChangeDetectionStrategy.OnPush**: Always configure performance-critical page and card components (e.g., `Home`, `ExpertCard`) with `OnPush` detection to optimize memory footprint and render overhead.
- **Scroll Animations & IntersectionObserver**: Respect the `@media (prefers-reduced-motion: reduce)` system setting to bypass motion/shifting transitions for screen accessibility.
- **Lazy Loading**: Force `<img loading="lazy">` for all perito profiles and search cards to minimize page weights.

---

## 🛰️ Maintenance Log

| Date | Author | Action | Status |
| :--- | :--- | :--- | :--- |
| 2026-05-18 | System Pilot | Fixed `reviewer_name` Null Constraint on review submission | Completed |
| 2026-05-18 | System Pilot | Material Design 2 UI overhaul of the search/hero landing widgets | Completed |
| 2026-05-18 | System Pilot | Dynamic active Perito stats count from Supabase | Completed |
| 2026-05-18 | System Pilot | Dynamic Title & SEO metatags integration on OnInit | Completed |
