# 🚀 Project Constitution - Contrate seu Perito

## 📌 Metadata & Context
- **Project Name:** Contrate seu Perito
- **Tech Stack:** Angular (Frontend), Supabase (Backend/Database)
- **Role:** System Pilot (A.N.T. Protocol)

## 🗄️ Database Schemas

### Table: `reviews`
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

### Table: `profiles`
```sql
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name text NULL,
    last_name text NULL,
    full_name text NULL,
    role text NOT NULL DEFAULT 'client'::text,
    -- ... other columns
    CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
```

## ⚙️ Behavioral Rules
1. **Never Save Null review_name**: In review creation, always fetch and populate `reviewer_name` from the client profile associated with `client_id` (fallback to `'Cliente'` if name is missing).
2. **Deterministic DB Interactions**: Use the `SupabaseService` wrapper for all database calls to ensure uniform error handling and consistent schema interactions.
3. **No Placeholders in Code**: Always write full, production-ready, typed implementations.

## 🏛️ Architectural Invariants
- All backend-related services live in [supabase.service.ts](file:///c:/Users/ibcap/dyad-apps/Contrate-seu-perito/src/app/services/supabase.service.ts).
- Client components should not perform database CRUD operations directly; they must interact via services.
- Data structures passed to database tables must strictly align with the database constraint schemas.
