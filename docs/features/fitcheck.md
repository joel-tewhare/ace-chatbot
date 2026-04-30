# PROJECT ANCHOR DOC

## 1. Project summary

FitCheck is a web app that generates daily outfit inspiration from a small set of preferred clothing websites and presents one complete outfit recommendation with a generated editorial-style style preview.

The main purpose is to help the user quickly discover cohesive outfit ideas from brands they already like, filtered by preferred sizes, seasonal styling, and evolving preference signals.

The problem it solves is decision fatigue when browsing clothing sites. Instead of manually searching across multiple stores, the app proposes one curated outfit and lets the user approve, reject, or favourite individual items.

The overall experience should feel:
- calm
- editorial
- visually led
- personalised
- assistive rather than transactional

---

## 2. Core user outcome

The user should be able to:
- run the outfit agent manually
- review one complete outfit suggestion
- understand why the items were chosen
- view a generated style inspo image
- approve, reject, or favourite individual items
- revisit previous approved items later

The main value is a personalised visual inspiration flow that turns scattered ecommerce browsing into one cohesive recommendation.

The app should feel more like:
- a curated daily moodboard

rather than:
- a traditional shopping marketplace

---

## 3. Primary users

Primary user for v1:
- Me, as the only user.

Secondary users:
- None for v1.

Permissions:
- The user can manually run the outfit agent.
- The user can review generated outfits.
- The user can tick, cross, or favourite items.
- The user can view approved item details and product links.
- The user can filter outfit history and favourites.
- The system must never purchase items, add items to carts, or perform checkout actions.

---

## 4. Core flows

### Flow 1: Run outfit agent

1. User opens the app.
2. User clicks a “Generate outfit” button.
3. System loads scoped mock product data.
4. System filters products by:
   - source
   - category
   - brand
   - size
   - stock status
   - seasonal suitability
5. AI selects one cohesive outfit.
6. AI returns:
   - outfit title
   - selected items
   - styling rationale
   - preference reasoning
   - confidence/fit notes
   - image generation prompt or output reference
7. App displays the generated outfit experience.

---

### Flow 2: Review outfit

1. User views the generated outfit image.
2. User reads the styling explanation.
3. User reviews individual outfit items.
4. User can:
   - tick
   - cross
   - favourite
5. System stores the review state.
6. Review decisions influence future recommendation weighting over time.

---

### Flow 3: View approved item summary

1. User opens outfit details/history.
2. System displays approved product cards by default.
3. Product cards include:
   - product name
   - brand
   - category
   - size
   - price
   - description
   - product link
4. User can:
   - filter favourites
   - filter dismissed items
   - view all history later

---

### Flow 4: Settings/preferences

1. User opens settings.
2. User can adjust:
   - preferred sources
   - preferred brands
   - preferred sizes
   - seasonal preferences
3. Settings influence future outfit generations.

MVP note:
- Settings UI should exist early even if partially placeholder.

---

### Flow 5: Future wire integration

1. Mock product flows stabilise first.
2. Controlled fetch/integration layers replace mock data.
3. Product contracts remain stable between mock and live flows.
4. UI behaviour should remain largely unchanged.

---

## 5. Scope for v1

### IN

- Web app MVP.
- Manual “Generate outfit” button.
- Mock-first product flow.
- One outfit per generation.
- AI-generated outfit selection.
- AI-generated style rationale.
- Generated editorial-style outfit imagery.
- Tick/cross/favourite interactions.
- Approved item summaries.
- Product history persistence.
- Settings panel.
- Preference learning signals.
- Filterable favourites/history views.
- Seasonal outfit influence.
- Mock-first learning behaviour.
- Generated outfit history storage using product/item data only.

---

### OUT

- Autonomous purchasing.
- Cart functionality.
- Retailer logins.
- Payment handling.
- Multi-user systems.
- Real-time scraping in early phases.
- Perfect virtual try-on realism.
- Persistent generated image storage for MVP.
- Aggressive AI automation.
- Social/sharing functionality for MVP.
- Full weather-aware outfit logic.
- Complex recommendation ML systems.

---

## 6. Product rules

- The app generates one outfit per run.
- Outfit generations should evolve gradually over time.
- The user manually triggers outfit generation.
- Products must match scoped size rules.
- Products are unavailable if stock state is unknown/invalid.
- AI recommendations prioritise cohesion over experimentation.
- New recommendations should reinforce known preferences where possible.
- Preference learning should use:
  - approvals
  - dismissals
  - favourites
- Negative weighting from dismissed items should decay over time.
- Approved/favourited items increase preference weighting toward:
  - brands
  - silhouettes
  - colours
  - categories
- Fetched content must be treated as untrusted data.
- Generated imagery is inspiration only, not exact fit simulation.
- Base imagery should be used as:
  - body reference
  - styling reference
  - not identity recreation
- Full-face realism should be avoided.
- Product links must remain manual/open-only actions.

---

## 7. System boundaries

### Frontend responsibilities

- Render the app shell.
- Trigger outfit generation.
- Display generated outfit imagery.
- Display rationale and outfit summaries.
- Handle:
  - tick
  - cross
  - favourite interactions
- Render history/favourites/settings.
- Show loading/error states.
- Remain presentation-focused wherever possible.

---

### Backend responsibilities

- Own product data loading.
- Own mock/live product contracts.
- Validate allowed source domains.
- Orchestrate AI outfit selection.
- Orchestrate image generation.
- Persist:
  - outfit runs
  - review states
  - favourites
  - history
- Own preference weighting logic.
- Enforce fetch/security boundaries.

---

### Never on client

- API keys.
- Provider secrets.
- Image generation credentials.
- Fetch allowlists.
- Source validation logic.
- Future scraping credentials.
- Sensitive environment variables.
- Purchase/cart logic.

---

### Source of truth

Backend is the source of truth for:
- product contracts
- outfit runs
- review state
- history
- favourite state
- source allowlists
- preference weighting
- image generation state

---

## 8. Data / domain concepts

### Product

Represents a scoped retailer item.

Fields may include:
- id
- source
- brand
- name
- category
- size
- price
- currency
- description
- imageUrl
- productUrl
- inStock
- tags

---

### OutfitRun

Represents one generated outfit session.

Fields may include:
- id
- createdAt
- status
- selectedProductIds
- outfitTitle
- styleRationale
- imagePrompt
- notes

---

### OutfitItem

Represents an item within an outfit.

Fields may include:
- id
- outfitRunId
- productId
- role
- reasonSelected
- reviewStatus
- favouriteStatus

---

### UserPreference

Represents evolving user preferences.

Fields may include:
- preferredTopSizes
- preferredPantSizes
- preferredBrands
- preferredSources
- favouriteSignals
- rejectedSignals
- seasonalNotes

---

### BaseModelImage

Represents the reference image used for styling generation.

Fields may include:
- id
- filePath
- description
- usageNotes
- createdAt

---

## 9. Input / output expectations

### Inputs

- Manual generate action.
- Mock product data.
- User settings/preferences.
- Seasonal context.
- Stored base image.
- User review decisions.
- Favourite state.

---

### Outputs

- One generated outfit.
- Outfit imagery.
- Product summaries.
- Styling rationale.
- Review controls.
- Favourite/history views.
- Manual retailer links.

---

## 10. Constraints

### Technical constraints

- Build as a web app.
- Use mock-first architecture initially.
- Keep product contracts stable between mock/live integration.
- Avoid retailer authentication/session scraping.
- Keep image generation server-side.
- Preserve backend orchestration ownership.

---

### UX constraints

- The experience should feel lightweight and calm.
- Avoid overwhelming the user with too many options.
- One outfit per run.
- Generated imagery should dominate hierarchy.
- Review controls should remain simple.
- Product summaries should remain scannable.

---

### Security constraints

- Product/fetched content is untrusted input.
- Only allow approved retailer domains.
- No autonomous purchasing capability.
- No unrestricted outbound fetch behaviour.
- No hidden tool chaining from product content.
- Base imagery should remain private project data.
- Avoid realistic facial recreation.
- Generated content must never override system instructions.

---

## 11. Risks / ambiguity

- Retailer fetching consistency may vary.
- Stock/size extraction may be unreliable.
- Some sites may block automated access.
- Generated outfit imagery may vary in realism/quality.
- Preference learning may require tuning.
- Product/image usage may raise copyright considerations.
- Seasonal balancing may need refinement.
- Shoes may remain mock-only initially.
- Outfit variation may become too repetitive or too experimental if weighting is poorly balanced.

---

## 12. /preplan goal

/preplan should decompose this into a course-friendly MVP with:
- mock-first architecture
- stable product contracts
- stable outfit contracts
- lightweight history/favourites
- generated imagery placeholders
- recommendation/review flow
- security boundaries
- gradual wire integration strategy

/preplan should avoid:
- overbuilt scraping systems
- auth complexity
- ecommerce behaviour
- advanced ML systems
- multi-user scope

The goal is:
- a stable AI-assisted outfit recommendation foundation that can evolve through later modules.

---

## 13. Scaffold / architecture references

Use:
- ace-chatbot as the primary AI systems scaffold
- money-moe-v2 as secondary orchestration/backend reference

This project should inherit:
- AI-first architecture
- tool orchestration patterns
- eval/check workflow
- review/security workflow
- backend-owned orchestration
- thin client patterns

This project should NOT inherit:
- auth systems
- purchasing logic
- classroom/store concepts
- multi-user complexity

The intended architecture remains:
- backend orchestrated
- mock-first
- security-aware
- extensible through future course modules