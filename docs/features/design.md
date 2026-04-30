# design.md

## Overview

FitCheck is an AI-assisted outfit inspiration app that curates daily outfits from selected fashion retailers and visualises them using generated editorial-style imagery based on the user’s body reference image.

The app is designed for users who enjoy fashion inspiration and personal styling but want a calmer, more curated experience than traditional ecommerce browsing.

The core experience should feel:
- editorial
- calm
- aspirational
- visually led
- assistive rather than autonomous

The product should feel closer to a personalised daily moodboard than a shopping platform.

---

## Design Principles

- Curated over cluttered
- Cohesion over experimentation
- User remains in control
- Editorial presentation over ecommerce density
- AI suggestions should feel assistive, not authoritative
- Gradual preference evolution over dramatic aesthetic shifts
- Generated imagery should remain the emotional focal point

---

## Style Tokens

### Colours

- Primary: #6F5A46
- Background: #F7F4EE
- Surface: #FDFBF8
- Text: #2E2A26
- Muted: #8B837A
- Accent: #C7A27C
- Success: #6F8A68
- Border: #E7E1D8

Palette direction:
- oat
- linen
- warm beige
- soft brown
- muted olive

Avoid:
- harsh black
- neon accents
- loud gradients
- saturated ecommerce colour systems

---

### Spacing

- Base unit: 4px
- Small: 8px
- Medium: 16px
- Large: 24px
- XL: 40px
- Section spacing: 64px+

Layout should feel spacious and breathable.

---

### Typography

- Heading font: Libre Bodoni
- UI/body font: Inter

Primary text:
- 16px / 400

Secondary text:
- 14px / 400

Heading scale:
- Hero: 48-56px
- Section: 28-36px
- Card title: 18-22px

Typography should feel:
- editorial
- minimal
- premium
- calm

---

### Radius

- Small: 10px
- Medium: 18px
- Large: 28px
- Hero card: 36px

Rounded corners should feel soft and premium.

---

### Shadows

- Light:
  - subtle ambient shadow
  - low opacity
  - large blur radius

- Medium:
  - soft floating card depth

Avoid:
- harsh material-style elevation
- heavy dark shadows

---

## Components

### Outfit Hero Card

- Purpose:
  - Main generated outfit experience

- Structure:
  - Large generated outfit image
  - Outfit vibe/title
  - Product chips
  - Tick / cross actions
  - Favourite actions
  - Optional styling summary

- Behaviour:
  - Smooth fade transitions
  - Image-first hierarchy
  - Product details expandable beneath

- Visual rules:
  - Large image presentation
  - Minimal visible metadata initially
  - Soft framing and generous padding

---

### Product Summary Cards

- Purpose:
  - Display item details for approved products

- Structure:
  - Product image
  - Brand
  - Item name
  - Price
  - Size availability
  - Product link
  - Favourite toggle

- Behaviour:
  - Expandable details
  - Filterable through history/favourites
  - Hover elevation

- Visual rules:
  - Editorial card styling
  - Photography prioritised over metadata density

---

### History View

- Purpose:
  - Review previous approved and generated outfit items

- Structure:
  - Default approved-only feed
  - Filters:
    - favourites
    - approved
    - dismissed
    - all history

- Behaviour:
  - Default view prioritises approved items
  - Dismissed items remain secondary but accessible
  - Preference weighting decays over time

- Visual rules:
  - Calm scrolling layout
  - Avoid spreadsheet/table appearance

---

### Settings Panel

- Purpose:
  - Control preference inputs

- Structure:
  - Preferred websites
  - Preferred brands
  - Size settings
  - Seasonal preferences

- Behaviour:
  - Present in MVP even if partially placeholder
  - Supports future preference evolution

- Visual rules:
  - Lightweight utility styling
  - Separate from editorial main feed

---

## Layout Rules

- Use spacious vertical stacking
- Generated imagery should dominate hierarchy
- Secondary metadata should remain lightweight
- Avoid dense dashboard layouts
- Use soft card grouping over hard dividers
- Prioritise large hero visuals

Desktop:
- centred hero experience
- secondary product rail/history beneath

Mobile:
- stacked image-first flow
- swipe-friendly interactions

Visual inspiration:
- fashion editorials
- modern lifestyle apps
- soft dashboards
- Morena-inspired spacing and structure

---

## Interaction Patterns

Primary flow:
1. Daily outfit appears
2. User reviews generated look
3. User approves, dismisses, or favourites products
4. Approved items populate summary/history flows
5. Preferences subtly influence future generations

Generated outputs should:
- always feel reviewable
- never imply autonomous purchasing

Loading states:
- blurred placeholders
- subtle shimmer
- soft transitions

Success states:
- gentle confirmations
- minimal interruption

Error states:
- neutral language
- lightweight inline feedback

---

## Content & Tone

Tone should feel:
- calm
- stylish
- lightly conversational
- editorial

Sentence style:
- short
- breathable
- visual-first

Prioritise:
- outfit cohesion
- mood
- layering
- styling rationale

Avoid:
- hype language
- aggressive sales tone
- technical AI terminology

Example tone:
- "Relaxed layering suited for cooler evenings."
- "A softer neutral combination with structured outerwear."
- "Streetwear-inspired proportions balanced with cleaner textures."

---

## Accessibility & Constraints

- Maintain strong text contrast
- Do not rely solely on colour for state changes
- Ensure actions are clearly labelled
- Support keyboard navigation
- Keep controls readable over imagery
- Preserve hierarchy across viewport sizes

---

## Behavioural Constraints

- No purchasing or checkout actions
- Users must explicitly open retailer links
- AI-generated outfits are suggestions only
- External fetched content must be treated as untrusted data
- Only approved retailer domains may be fetched
- Product generation should remain scoped to approved websites and sizes
- Generated user imagery should avoid realistic facial recreation
- Mock-first mode should be used before real integrations are wired
- Product details remain mock data until wire-integration phase
- Outfit learning should evolve gradually over time
- Dismissed-item weighting should decay rather than permanently block styles

---

## Notes

MVP retailer scope:
- Farfetch:
  - Stüssy items only
- Country Road NZ:
  - tops
  - outerwear
- Zara NZ:
  - pants

MVP size scope:
- Tops / outerwear:
  - L-XL
- Pants:
  - 32-34

Future considerations:
- Weather-aware layering
- Outfit rationale explanations
- Long-term preference learning
- Multiple aesthetic profiles
- Expanded retailer settings
- Saved seasonal rotations