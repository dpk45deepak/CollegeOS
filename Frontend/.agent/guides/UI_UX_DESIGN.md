# UI/UX Design Playbook (Modern EdTech & Learning Hub Spec)

## Visual Direction & Core Aesthetic
- **Archetype**: Modern, clean, warm, and highly approachable EdTech interface (inspired by modern learning platforms like LearnHub / Coursera / Duolingo-pro).
- **Tone & Mood**: Inspiring, structured, high-clarity, and trustworthy. Avoid cold enterprise density or aggressive neo-brutalism.
- **Surface & Elevation**: Clean white/light neutral surfaces with soft, diffused ambient drop shadows (`box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05)`). Use crisp hairline borders (`1px solid var(--border-subtle)`) rather than heavy outlines.
- **Depth & Accents**: Subtle decorative badge highlights, warm accent pills ("New: AI-Powered Learning"), and floating interactive course progress widgets (e.g., live learning cards overlaid near heroes).

## Design Tokens & Palette Spec
- **Color System**:
  - `primary`: Vibrant Indigo / Royal Blue (`#4F46E5` or `#2563EB`) — used for high-intent CTAs, active states, and brand marks.
  - `primary-hover`: Darker indigo/blue (`#4338CA` or `#1D4ED8`).
  - `accent / highlight`: Warm Amber or Emerald (`#F59E0B` for ratings/badges, `#10B981` for completed progress).
  - `background`: Pure White (`#FFFFFF`) or ultra-soft slate-white (`#F8FAFC`).
  - `surface-card`: `#FFFFFF` with soft border `#E2E8F0` or `#EEF2F6`.
  - `text-heading`: Deep slate (`#0F172A`).
  - `text-body`: Balanced readable slate (`#334155`).
  - `text-muted`: Medium neutral (`#64748B`).
- **Radii scale**:
  - Tags & Buttons: Rounded full (`rounded-full` / `9999px`) or soft squircle (`rounded-xl` / `12px`).
  - Cards & Containers: `rounded-2xl` (16px to 20px) to keep a friendly, modern feel.
- **Typography Scale**:
  - Font family: Clean geometric sans-serif (`Inter`, `Plus Jakarta Sans`, or `Geist Sans`).
  - Hero display: Bold, high-contrast headline (`text-4xl` to `text-6xl`, tracking tight `-0.02em`) with intentional line breaks and vibrant keyword accents.
  - Section headers: Clear label pill / badge above the title (e.g., `Why Choose Us` -> `Everything You Need to Succeed`).

## Page Sections & Composition Blueprint
When generating educational dashboards, landing pages, or course views, follow this structured narrative flow:

1. **Header & Navigation**:
   - Clean sticky navigation bar with brand icon + title, navigation links (`Courses`, `Teachers`, `Pricing`, `About`), and clear separation between `Log In` (ghost) and `Start Free` / `Get Started` (solid primary pill).
2. **Hero with Live Preview Float**:
   - Split layout (or centered stack): left side features an announcement pill ("New: AI-Powered Learning"), bold value proposition headline, concise subtext, dual CTAs (`Start Learning Free` + secondary `Browse Courses`), and a proof metric strip (`10K+ Courses`, `2M+ Students`, `500+ Instructors`).
   - Right side features an interactive-feeling card component: e.g., an in-progress card (*"Web Development - 12 lessons • 4h 30m"*, progress bar at 65%, and a clear `Continue Learning` button).
3. **Course Card Grid & Data Tokens**:
   - Each course card must present structured metadata at a glance:
     - High-aspect preview thumbnail or contextual gradient illustration.
     - Category badge & instructor name (`by Sarah Chen`).
     - Course title in bold slate.
     - Metric meta row: Lesson count (`48 lessons`), total duration (`24h`), enrolled count (`12.5K`), and star rating pill with amber icon (`⭐ 4.9`).
4. **Feature & Value Propositions**:
   - 3 or 4-column feature grid with icon badges (e.g., *Learn at Your Pace*, *Expert Instructors*, *Recognized Certificates*, *Community Support*).
   - Generous breathing room and soft background tint to section boundaries.
5. **Social Proof & Testimonials**:
   - Quote cards with star ratings, quotes detailing transformation/outcomes, student avatar initial circle, name, and current role/title (`Jessica Wang — Software Developer`).
6. **High-Conversion Call to Action (CTA)**:
   - High-contrast banner block with reassurance badges: `"First 7 days free"`, `"No credit card required"`, `"Cancel anytime"`.
7. **Comprehensive Footer**:
   - Multi-column footer organizing links across Courses, Company, Resources, and Legal with copyright and social links.

## Educational Micro-Interactions & States
- **Progress Trackers**: Always display completion percentages with smooth rounded progress bars (`h-2 rounded-full bg-slate-100` filled with `bg-primary` or `bg-emerald-500`).
- **Interactive Cards**: Subtle lift on hover (`translate-y-[-4px]` with shadow expansion `shadow-md` to `shadow-xl`) and smooth transitions (`transition: all 0.2s ease`).
- **Empty & Loading States**:
  - Course listings need skeleton cards with shimmer effect matching the exact layout of course cards.
  - Empty search / filters need an illustration or icon, encouraging text, and a `"Reset Filters"` CTA.

## Responsive Behavior & Layout Guardrails
- **Mobile First**: Single-column collapse for course grids (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
- **Touch Ergonomics**: Minimum 44px tap targets for mobile nav toggles, filter chips, and CTA buttons.
- **Horizontal Overflow Control**: Use horizontal scroll with snap alignment (`overflow-x-auto snap-x`) only for course category chips or mobile metric badges; keep content blocks cleanly bounded.

## Code & Quality Checklist
- Avoid generic Lorem Ipsum; generate realistic educational context, instructor names, course durations, lesson counts, and reviews.
- Use accessible SVG icons (Lucide or Feather equivalents: star, clock, book-open, user, check-circle) rather than raw emojis for structural UI elements.
- Validate WCAG AA contrast ratio between slate text and light card backgrounds.
- Deliver semantic HTML5 tags (`<nav>`, `<header>`, `<main>`, `<section>`, `<article>`, `<footer>`).