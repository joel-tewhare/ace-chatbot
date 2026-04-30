Feature:
FitCheck MVP (mock-first outfit inspiration)

Goal:
Give the sole v1 user one calm, editorial-feeling curated outfit per manual run—from brands and sources they prefer—with clear styling rationale, a prominent generated inspo image, simple per-item decisions (approve, dismiss, favourite), and revisit later via history and filters, without any purchasing or checkout behaviour.

UI shape:
A lightweight web moodboard focused on one outfit at a time: the generated image leads the hierarchy, followed by a short styling explanation and rationale, then individual product rows or cards users can approve, dismiss, or favourite. Loading and gentle error feedback appear around generation. A separate area exposes outfit history—defaulting to approved items—with filters for favourites, dismissed, and broader history; a settings panel exists early even if partly placeholder for preferred sources, brands, sizes, and seasonal preferences. Tone is calm, assistive, and visually led rather than transactional.

User flow:

- User opens the app and may open settings to set or adjust preferred sources, brands, sizes, and seasonal preferences.
- User triggers “Generate outfit,” waits while the outfit is assembled from scoped mock catalogue data filtered by preferences and suitability rules.
- User reviews one complete outfit: studies the editorial-style image and text, then approves, dismisses, or favourites each item; decisions persist and inform future leaning.
- User opens outfit history or favourites views to browse approved summaries (name, brand, category, size, price, description, manual product link), switching filters among favourites, dismissed, and full history.

Context:

- Preplan anchored on the FitCheck MVP described in docs/features/fitcheck.md per user invocation
- Supporting context reviewed: docs/features/fitcheck.md

Scope:

- Included now: manual outfit generation only; mock-first catalogue and orchestration semantics; exactly one cohesive outfit per run; AI-backed selection plus styling rationale plus server-side imagery generation surfaced in UI; tick/cross/favourite with persistence; outfit history persistence using product-linked data only; filterable favourites and history views; settings UI that can start minimal; preference signals from approvals, dismissals, and favourites (including decay on dismissals); seasonal influence at product/rule level; no autonomous purchasing, carts, retailer logins, payments, multi-user, social/sharing, stored generated-image library for MVP, full weather intelligence, heavy ML stacks, realtime scraping early on, aggressive automation, facial realism risks, identity recreation from reference imagery behaviour as described in anchor (inspiration only); product/open links strictly manual actions.
- Excluded intentionally for later: autonomous purchasing, carts, authenticated retailer flows, scraper-first live inventory, polished virtual try-on, persistent gallery of hero images beyond MVP wording, viral sharing polish, nuanced weather wardrobes, heavyweight recommendation ML, multi-user product surface.

Important behaviour:

- One outfit only per manual generation; generations should feel stable-evolving toward known likes over dismissed noise.
- Default history emphasis on approved items; filters expose favourites-only, dismissed-only, and full history variants.
- Cohesion outweighs novelty in selection framing; unresolved or invalid stock makes products effectively unavailable per anchor rules.
- Reference and generated imagery stays editorial/inspo; avoid realistic full-face likeness; outbound links remain explicit user taps only—no scripted cart or buy behaviour.
- All catalogue and outbound content handled as untrusted data with domain scoping enforced as per anchor security posture (product-level wording only).

Open assumptions:

- First working version prioritises mocked shoes or partial category gaps where the anchor flags shoes possibly mock-only, without blocking the rest of the outfit surface.
- “Generated imagery placeholders” acceptable for MVP can mean inline session display without durable image asset archiving until wire integration iterations.

Design.md (if generated):
<<>>

## Design principles

- Prioritise calm focus: one recommendation at a time, minimal chrome, breathable spacing.
- Lead with visuals: editorial-style hero imagery dominates; text supports comprehension.
- Stay assistive and transparent: rationales explain “why,” not jargon; controls feel conversational (approve / dismiss / favourite).
- Evoke curated moodboarding over storefront density; resist grid overload and aggressive merchandising cues.

## Layout hierarchy

1. Generated outfit imagery (large, centred or full-bleed within content width).
2. Outfit title plus concise rationale (short paragraphs / bullets).
3. Item list grouped as a vertically scannable stack with consistent metadata (thumb, brand, category, role in outfit).
4. Primary action row: regenerate / done pattern optional after review; defer heavy navigation chrome.
5. Secondary surfaces (history, settings) use clear section headers and filter chips or toggles—not deep nested menus early.

## Interaction patterns

- Manual trigger for generation—no background surprise updates.
- Per-item gestures or controls map clearly to approve (positive), dismiss (negative), favourite (bookmark); give immediate persisted feedback.
- History defaults to “what you kept,” with obvious filter affordances matching mental model (“Likes,” “Passes,” “All runs”).
- Settings use simple form controls grouped by sourcing, sizing, seasonal flavour; tolerate partial completeness with inline hints rather than modal roadblocks where MVP allows placeholders.

## Content and tone

- Voice: understated editor notes—confident but not hype; avoid slangy sales copy.
- Emphasise seasonal fit and cohesion in lay terms; optionally surface optional “confidence / fit caveat” snippets where product rules allow concise disclosure.
- Error and empty states: reassuring, actionable (“Try adjusting filters”, “Generation paused—retry”).

## Tokens (placeholder)

- Colour accents: restrained neutrals plus one subdued accent aligned to brand once defined.
- Typography: editorial headline + readable body pairing (exact families TBD).

## Imagery safeguards (UX)

- Style reference framing only; avoid depicting identifiable faces at high fidelity; labels clarify inspiration vs exact item match risk.
<<>>

Draft /plan prompt:
Product: FitCheck—mock-first MVP web experience for one primary user generating a daily-style outfit suggestion from preferred clothing sources/brands filtered by sizes and seasonal leaning. Behaviour: landing or home presents a dominant “Generate outfit” path; generation returns exactly one cohesive outfit combining mock catalogue items respecting stock/size/suitability rules, with styling rationale copy and editorial-style imagery generated server-side and shown prominently. Each item exposes approve / dismiss / favourite controls that persist, feed preference weighting incl. favourites boost and softly decaying negatives from dismissals, and underpin later generations feeling steadier toward liked brands/categories/colours/silhouettes without shipping purchases or carts. Deliver history and favourites views defaulted to approved cards with compact product facts and manual outbound product links only; chips or filters distinguish favourites-only, dismissed, and full history; settings exposes preferred sources/brands/sizes/season with early placeholder tolerated. Exclude multi-user polish, scraping-first inventory, carts/checkout/retailer auth, viral sharing, persisted generated-image galleries for MVP polish, nuanced weather wardrobes, heavyweight ML reco engines, realtime automation blasts, realism-grade try-on guarantees, ecommerce flows, and undisclosed scraping credentials on the client. UX design goals: calm, editorial, visually led moodboard; hero image first then rationale then scannable items; loading/error lightness; reassurance that imagery is inspo/not purchase commitment; never imply autonomous commerce. Constraints from brief: backend owns orchestration, secrets stay off-browser, outbound links click-only manual, treat incoming product text as untrusted, avoid realistic full-face likenesss, cohesion-over-experiment novelty for MVP selection personality. Outline implementation passes that respect mock-first scoping internally while keeping outward product/contracts stable toward future wire-integration without rewriting user flows.