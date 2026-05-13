---
name: Pastel Performance Journal
colors:
  surface: '#faf9f6'
  surface-dim: '#dbdad7'
  surface-bright: '#faf9f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f3f1'
  surface-container: '#efeeeb'
  surface-container-high: '#e9e8e5'
  surface-container-highest: '#e3e2e0'
  on-surface: '#1a1c1a'
  on-surface-variant: '#404848'
  inverse-surface: '#2f312f'
  inverse-on-surface: '#f2f1ee'
  outline: '#707979'
  outline-variant: '#c0c8c8'
  surface-tint: '#356668'
  primary: '#356668'
  on-primary: '#ffffff'
  primary-container: '#a8dadc'
  on-primary-container: '#306163'
  inverse-primary: '#9ecfd1'
  secondary: '#874e58'
  on-secondary: '#ffffff'
  secondary-container: '#ffb6c1'
  on-secondary-container: '#7b444e'
  tertiary: '#5f559a'
  on-tertiary: '#ffffff'
  tertiary-container: '#d3cbff'
  on-tertiary-container: '#5a5095'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b9ecee'
  primary-fixed-dim: '#9ecfd1'
  on-primary-fixed: '#002021'
  on-primary-fixed-variant: '#1a4e50'
  secondary-fixed: '#ffd9de'
  secondary-fixed-dim: '#fcb3be'
  on-secondary-fixed: '#360c17'
  on-secondary-fixed-variant: '#6b3741'
  tertiary-fixed: '#e5deff'
  tertiary-fixed-dim: '#c8bfff'
  on-tertiary-fixed: '#1b0c53'
  on-tertiary-fixed-variant: '#473d81'
  background: '#faf9f6'
  on-background: '#1a1c1a'
  surface-variant: '#e3e2e0'
typography:
  display-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-sm:
    fontFamily: Quicksand
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-sm:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  xl: 2.5rem
  gutter: 1rem
  margin-mobile: 1.25rem
  margin-desktop: 4rem
---

## Brand & Style

This design system is built on a foundation of "Gentle Minimalism." It is designed for theater enthusiasts who view their performance tracking as a curated, personal diary rather than a high-performance utility. The emotional response is one of calm, nostalgia, and quiet elegance.

The visual style merges **Minimalism** with **Tonal Layering**. It avoids harsh lines and high-contrast blacks, opting instead for a "macaron-inspired" aesthetic where every element feels soft to the touch. Generous negative space is utilized to allow the performance artwork and memory-based content to breathe, creating a sense of organized serenity.

## Colors

The color strategy uses low-saturation "macaron" pastels to distinguish different types of performances or categories without overwhelming the user. 

- **Primary (Mint):** Used for primary actions, success states, and active navigation indicators.
- **Secondary (Pink):** Used for highlights, favorites, and sentimental call-outs.
- **Tertiary (Lavender):** Used for secondary categories or informational tags.
- **Neutral (Cream):** The primary background color, providing a warmer, more "paper-like" feel than stark white.
- **Text:** We avoid pure black (#000) in favor of a deep, desaturated sage green or soft charcoal to maintain the gentle mood.

## Typography

This design system exclusively utilizes **Quicksand** for its rounded terminals and friendly, open counters. This choice reinforces the approachable, non-intimidating nature of the tracking experience.

- **Headlines:** Use SemiBold or Bold weights with slightly tighter letter-spacing to create a distinctive, grounded look for performance titles.
- **Body Text:** Medium weight is preferred for general legibility against the low-saturation backgrounds.
- **Labels:** Small caps or increased letter-spacing are used for dates and metadata to ensure they feel organized and "archival."

## Layout & Spacing

The layout follows a **Fluid Grid** model with an emphasis on "Bento-style" card containment. 

- **Mobile:** A 2-column or 1-column grid is used for performance lists to maximize the visual impact of theatrical posters. 
- **Desktop:** An 8 to 12-column grid with wide margins (`xl`) to preserve the minimalist feel.
- **Rhythm:** We use a strict 8px-based spacing scale, but lean toward the larger end of the scale (`lg` and `xl`) to maintain the "generous whitespace" requirement. Elements should never feel crowded; if in doubt, add more padding.

## Elevation & Depth

Depth is communicated through **Ambient Shadows** and **Tonal Layering** rather than heavy drop shadows.

- **Surface Levels:** The base layer is `Cream`. Secondary containers (cards, navigation bars) use absolute white or a very pale version of a brand color.
- **Shadows:** Use extremely diffused shadows with a high blur radius (20px+) and low opacity (5-8%). Shadows should be tinted with the `Sage` text color or the `Primary` mint color to avoid "dirty" grey looks.
- **Interactive Depth:** When a card is pressed, it should subtly scale down (0.98) rather than gaining a heavier shadow, simulating a physical "press" into a soft surface.

## Shapes

The shape language is defined by **large, friendly radii**. 

- **Cards & Primary Containers:** Use `rounded-xl` (1.5rem / 24px) to create a soft, "pillowy" aesthetic.
- **Buttons & Chips:** Use fully pill-shaped (rounded-full) corners.
- **Image Cropping:** Performance posters should always be clipped with the container's radius to ensure no sharp corners exist within the interface.

## Components

### Performance Cards
Cards are the primary storytelling unit. They feature a high-aspect-ratio image at the top, with a soft-tinted footer containing the title and date. The transition between the image and footer should be seamless, often using a subtle background tint from the palette.

### Navigation Tabs
The bottom navigation bar uses a "Floating Island" design. It is a single, highly rounded container with a soft shadow. The active state is indicated by a soft mint-colored circular background behind the icon, rather than a simple color change.

### Buttons & Chips
Buttons should be large with generous internal padding. Use "Ghost" styles for secondary actions (mint border, no fill) and "Solid" pastels for primary actions. Text inside buttons should always be `Quicksand Bold`.

### Subtle Icons
Icons should use a "Thin" or "Light" stroke weight (1.5px) with rounded caps and joins. Avoid filled icons unless they represent an active state; line icons maintain the airy, clean feeling of the system.

### Performance Feed
Lists should be presented as a staggered masonry grid or a clean vertical stack with `xl` spacing between items to allow each "memory" to stand alone.