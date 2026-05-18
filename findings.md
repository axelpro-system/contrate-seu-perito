# 🔍 Research & Findings

## 💡 Discoveries
- **Bug Root Cause**: The table `reviews` has a `reviewer_name` column defined as `NOT NULL`. However, when calling `createReview(...)` inside `ReviewDialog`, only `expert_id`, `client_id`, `rating`, `comment`, and `lead_id` were passed to the insertion payload.
- **Service Layer Signature**: The `createReview` method in `SupabaseService` does not have access to `reviewer_name` in its parameters.
- **Client Profiles Reference**: `client_id` corresponds to a record in the `profiles` table. The `profiles` table contains name components (`first_name`, `last_name`, `full_name`) that can be fetched to resolve the user's name dynamically.

## 🎨 Material Design 2 Optimizations & UI/UX Findings
- **Typography & Font Hierarchies**: Integrated serif styling (`EB Garamond`) for large display hero text and clean sans-serif styles (`Outfit`, `Inter`) for subheadings, dropdown menus, and form labels, as recommended by Material Design 2 guidelines.
- **Visual Elevation & Shadows**: Styled the search widget box with elevated shadows (`mat-elevation-z6` equivalent) and sleek glassmorphism to improve structure and make key interaction targets stand out.
- **Material Components (Chips & Controls)**: Re-designed inputs, select dropdowns, and search chips with active icons (`medical_services`, `engineering`, `draw`, `calculate`) to represent a high-end, responsive system.
- **Color Aesthetics**: Replaced generic colors with rich, curated color systems—using premium deep indigos and dark charcoal backdrops paired with gold and deep orange accents to offer a breathtaking first impression.

## ⚠️ Constraints
- The `createReview` method must return a response containing an optional `error` object so that `ReviewDialog`'s try/catch validation continues to function seamlessly.
- If profile fetching fails or the fields are null, a robust default of `'Cliente'` must be applied to prevent any constraint violations under any circumstances.
