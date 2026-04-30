# FitCheck MVP — pass-based implementation plan

Supporting context reviewed: `docs/preplans/fitcheck.md`, `docs/features/fitcheck.md`, `docs/features/design.md`

---

## Pass 1 — UI / Layout

### Context

- FitCheck is a single-user web moodboard: the primary surface is one outfit at a time after a manual generate action, with secondary areas for outfit/product history (including favourites and dismissed) and for settings.
- This pass establishes the screen structure and navigation affordances only.

### Scope

- **Included:** app entry path to the main outfit view; prominent “Generate outfit” trigger; large hero region for outfit imagery; outfit title and rationale copy areas; a vertical, scannable list of item rows (visual structure for thumb, brand, category, role-in-outfit); clear per-item controls mapping to approve, dismiss, and favourite; lightweight loading and error regions around generation; history area with section structure, default emphasis on “what you kept,” and filter affordances (favourites-only, dismissed-only, full history); settings area with grouped controls for sources, brands, sizes, and seasonal preferences (placeholders acceptable per MVP); product link presentation as static-looking targets only.
- **Not included:** live data, persisted state, computed lists, preference logic, or real history content.

### Layout

- **Main outfit:** hierarchy is hero imagery first (large, dominant within content width), then title plus concise rationale (short paragraphs or bullets), then item stack with consistent metadata slots; primary action row centres on generate (optional placeholders for done/regenerate only if they do not imply working behaviour).
- **History:** clear section headers; filter chips or toggles matching mental models (e.g. likes, passes, all runs) sitting above a card/list region consistent with compact product facts.
- **Settings:** simple grouped form layout with inline hints rather than blocking modals where completeness is partial.
- **Overall:** align with calm, editorial, visually led moodboard density; breathable spacing and restrained palette per existing design tokens; avoid storefront grid overload.

### Reuse

- Reuse the project’s existing shell, layout primitives, typography and spacing scale, buttons, inputs, and navigation patterns.

### Constraints

- No real or server-backed data; no derived or persisted behaviour; no new abstractions beyond what layout composition requires.

### Implementation order

1. Main outfit review scaffold: hero, title, rationale blocks, item stack skeleton, primary generate control, generation loading/error shells.
2. Per-item row structure and approve/dismiss/favourite controls as presentational-only states.
3. History and settings surfaces: headers, filter UI, list/card placeholders, grouped settings fields.

### Verification

- Hierarchy reads as imagery → rationale → items; controls unambiguously map to approve, dismiss, favourite; history and settings are reachable and structurally clear; no data or logic leakage into this pass.

---

## Pass 2 — Data Wiring

### Context

- Mock-first delivery: the backend owns orchestration, secrets, and contracts; the client triggers generation, displays the returned outfit and image reference, persists review and favourite actions, loads history by filter, and loads/saves settings—all via internal routes or server actions backed by seeded or fixture data, with **no** external retailer APIs, scraping credentials, or client-held secrets.

### Scope

- **Included:** connect Pass 1 UI to authoritative server responses for one outfit per generation; reflect outfit run metadata (title, rationale, notes, image URL or session image reference); bind item rows to product fields from the payload; submit and re-read per-item review and favourite state; fetch history collections keyed by filter mode (approved-default, favourites-only, dismissed-only, full history) using product-linked records; load and save user preference fields for settings; loading, empty, and basic error handling for these flows.
- **Not included:** preference weighting, decay, cohesion-based selection, re-ranking for future runs, client-side filtering beyond requesting the server-appropriate filter, or sorting rules beyond displaying data as returned unless identical to simple pass-through ordering.

### Data

- **Source of truth:** server for product contracts, outfit runs, item review state, favourites, history projections, preferences, and image generation output handles; client only renders and mutates through defined endpoints or actions.
- **Shapes:** align domain concepts from the anchor—`Product` (e.g. id, source, brand, name, category, size, price, currency, description, imageUrl, productUrl, inStock, tags); `OutfitRun` (e.g. id, createdAt, status, selected product references, outfit title, style rationale, image prompt or image delivery reference, notes); `OutfitItem` (run link, product link, role, reason selected, review status, favourite flag); `UserPreference` for settings (sources, brands, sizes, seasonal notes, etc.).
- **Flow:** generate request returns exactly one outfit payload; item actions update server state and return updated item flags; history requests return lists appropriate to the selected filter; settings round-trip the preference document.

### Behaviour

- Show loading during generation and initial fetches; empty states when there is no run or no rows for the active history filter; render returned strings and numbers faithfully; render product URLs as normal links only (explicit user navigation, no scripted commerce).
- **Selection vs refreshing data:** when history or favourites lists refresh after a mutation (e.g. favourite toggled), revalidate or clear any selected row or detail state that no longer exists in the current result set; keep the active filter chip consistent with the last successful response.

### Reuse

- Reuse existing client patterns for fetching, mutations, and cache or revalidation after writes—conceptually, without prescribing concrete hooks or filenames.

### Constraints

- Do not add derived business logic that belongs in orchestration (weighting, decay, outfit assembly); do not duplicate server validation or allowlist rules in the browser; do not introduce client-only sorting or filtering that changes the meaning of history beyond the server’s filter modes.

### Edge cases

- Missing or partial product fields; unknown or invalid stock treated as unavailable per server flag; empty history; generation or network failure with actionable, reassuring messaging.

### Implementation order

1. Wire generation to outfit payload: populate hero, title, rationale, items, and image reference; handle loading and error.
2. Wire per-item approve, dismiss, and favourite to the server and reconcile returned status on each row.
3. Wire history by filter mode and settings load/save; handle empty and error states for each.

### Verification

- Mock or seeded data appears throughout with no lingering layout placeholders posing as real content; loading and empty paths behave; after mutations, list and selection state stay coherent; links remain user-initiated only.

---

## Pass 3 — Derived Logic

### Context

- Orchestration already produced a single cohesive outfit and copy; this pass adds **presentational and UX interpretation** of data already on the client from Pass 2—without refetching or inventing new server fields.

### Scope

- **Included:** ordering or grouping of items within one outfit for scannability (e.g. by category or role); display-only emphasis for unavailable items; mapping persisted review and favourite flags to control visuals; presenting optional confidence or fit snippets and role labels when already present in the payload; stable client-side ordering of history rows only if needed for consistency and only from fields already returned.
- **Not included:** computing future recommendation scores, decay schedules, or server-side weighting; new API parameters; structural changes to stored data.

### Data

- Uses the outfit run payload, embedded items and product records, review and favourite flags, and any explanatory strings already returned by the server.

### Logic

- Deterministic rules for item order or grouping derived from category, role, or id tie-breakers, consistent with cohesion-first framing; visual treatment when `inStock` or equivalent marks an item as unavailable; consolidate multi-part rationale into the intended reading order without altering wording; ensure control active state reflects persisted status in one direction of truth from the last successful fetch or mutation response.

### Behaviour

- Item list reads in a predictable scan pattern; unavailable items do not read as shoppable; controls and badges match stored decisions and returned metadata; optional notes and safeguards (e.g. inspiration-not-exact-match) surface only from existing fields.

### Constraints

- No new data sources; no refetch or response reshaping beyond what Pass 2 established; keep logic local and readable; do not encode preference mathematics for **next** generation on the client—that remains server-owned.

### Edge cases

- Category gaps (e.g. shoes mock-only): layout and grouping still behave; a run with edge-case item counts; missing hero image: fall back per MVP placeholder rules without implying exact product match.

### Implementation order

1. Implement item ordering/grouping rules from returned categories and roles.
2. Apply unavailable styling and persisted review/favourite mapping for controls.
3. Finalise presentation of rationale blocks and optional notes from existing string fields only.

### Verification

- Grouping and emphasis match product expectations; server remains sole authority for preference evolution; no duplicated orchestration rules; UI states match persisted decisions after interactions.

---

## Pass 4 — Final Polish

### Context

- Final pass tightens FitCheck MVP for a cohesive, calm, editorial feel and safe UX boundaries before or alongside future wire-integration work.

### Scope

- Visual consistency with design tokens (colour, typography, spacing); refined loading and transition lightness; microcopy for errors and empty states per assistive, understated tone; accessibility for controls, focus, and links; clarify that imagery is inspirational and that outbound links are manual; small simplifications and removal of rough edges.

- **Behaviour:** confirm end-to-end flow: settings → generate → review with persisted decisions → history filters → settings updates still read correctly on next session in mock-first storage; ensure no language implies autonomous purchasing.

### Reuse

- Align spacing, component states, and patterns with the rest of the app for a single coherent product surface.

### Constraints

- No new features or major structural changes; polish and simplify only.

### Edge cases

- Long titles or descriptions; narrow viewports; minor inconsistencies between surfaces.

### Verification

- The feature feels cohesive and visually led; code paths remain clear; UX respects trust boundaries (untrusted product text treated as display-only; no hidden automation around links); mock-first behaviour is stable end-to-end for one primary user.

### Scaffold inheritance note

This project intentionally begins from a local copy of the existing ace-chatbot foundation rather than a completely empty repository.

The copied foundation should be treated as:
- reusable AI infrastructure
- tool/eval/review scaffolding
- security workflow groundwork
- provider wiring and orchestration setup

The project should progressively evolve away from tutorial-specific tooling and toward the FitCheck domain through iterative replacement of:
- prompts
- tools
- UI flows
- eval scenarios
- mock data contracts

The goal is to preserve stable AI systems infrastructure while reshaping the product/domain layer around the new outfit recommendation workflow.