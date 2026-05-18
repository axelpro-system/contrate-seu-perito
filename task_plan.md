# 📋 Task Plan: Implement Landing Page Optimizations

## 🎯 Goal
Implement the three key performance and SEO optimizations proposed in the landing page report:
1. **Dynamic SEO Metatags**: Integrate Angular's `Title` and `Meta` services on the Home page to dynamically inject search engine and open graph metatags.
2. **Image Optimization & Lazy Loading**: Retrieve perito profile pictures (`avatar_url`) from the database, display them in the featured experts section using dynamic lazy loading, and fall back cleanly to a stylized initials placeholder when no image is available.
3. **Dynamic Database Stats**: Dynamically query the database for the active perito count and use this number to drive the dynamic stats counter widget on the Home page.

## 🏁 Phases

### Phase 1: B - Blueprint (Research & Planning) [COMPLETED]
- [x] Analyze `Home` page (`home.ts`, `home.html`) and `ExpertCard` (`expert-card.ts`, `expert-card.html`, `expert-card.scss`).
- [x] Trace how `avatar_url` is handled in other profile sections.
- [x] Formulate the implementation plan for SEO tags, image mapping, and dynamic stats counts.

### Phase 2: L - Link (Connectivity Check) [COMPLETED]
- [x] Confirm table structures and columns (`profiles.avatar_url`, `profiles.profile_type`, etc.).

### Phase 3: A - Architect (Implementation) [COMPLETED]
- [x] Refactor `Home` component (`home.ts`) to:
  - Inject `Title` and `Meta` services.
  - Dynamically set Page Title, Description, and OG tags on initialization.
  - Map `avatarUrl` from `profiles.avatar_url` in the query result inside `loadFeaturedExperts()`.
  - Fetch count of active experts and apply it as the target for the stats counter.
- [x] Refactor `ExpertCard` (`expert-card.html`, `expert-card.scss`) to render the profile picture using `<img loading="lazy">` when `avatarUrl` exists, maintaining absolute visual consistency and responsiveness.
- [x] Style the entire layout using Material Design 2 typography, elevated search containers, specialized chips with Material icons, and clean high-end color themes.

### Phase 4: S - Stylize (UX Validation) [COMPLETED]
- [x] Check look and feel of profile pictures within cards, ensuring responsive resizing on mobile screen bounds.
- [x] Add high-end CSS transitions, responsive grid scaling, and clean interactive states for dropdowns and buttons.

### Phase 5: T - Trigger (Verification & Deploy) [COMPLETED]
- [x] Execute Angular production build (`npm run build`) to ensure type safety and error-free compilation.
- [x] Visually verify landing page visual states, search widgets, cards, and animations in the browser.
- [x] Extract high-fidelity screenshots showcasing the new premium Material Design 2 layouts, now embedded inside `walkthrough.md`.

### Phase 6: Real Search Filter Counts (Dynamic Counts) [IN PROGRESS]
- [ ] Implement query in `home.ts` to retrieve `specialty, tags, city, state` for all active and visible peritos.
- [ ] Compute real-time count maps for all specialties and locations dynamically in memory.
- [ ] Update the `home.html` select dropdown options to display dynamic counts next to each specialty/location.
- [ ] Add loading skeletons or smooth count transitions to ensure high-fidelity UI.
- [ ] Verify that counts update correctly and that selecting options displays accurate filtered search results.
- [ ] Trigger an Angular production build (`npm run build`) to confirm zero compilation errors.
