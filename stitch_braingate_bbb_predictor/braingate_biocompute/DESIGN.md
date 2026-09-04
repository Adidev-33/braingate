---
name: BrainGate BioCompute
colors:
  surface: '#0f131c'
  surface-dim: '#0f131c'
  surface-bright: '#353943'
  surface-container-lowest: '#0a0e17'
  surface-container-low: '#181b25'
  surface-container: '#1c1f29'
  surface-container-high: '#262a34'
  surface-container-highest: '#31353f'
  on-surface: '#dfe2ef'
  on-surface-variant: '#bcc9cd'
  inverse-surface: '#dfe2ef'
  inverse-on-surface: '#2c303a'
  outline: '#869397'
  outline-variant: '#3d494c'
  surface-tint: '#4cd7f6'
  primary: '#4cd7f6'
  on-primary: '#003640'
  primary-container: '#06b6d4'
  on-primary-container: '#00424f'
  inverse-primary: '#00687a'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#1bbd85'
  on-tertiary-container: '#00452e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#acedff'
  primary-fixed-dim: '#4cd7f6'
  on-primary-fixed: '#001f26'
  on-primary-fixed-variant: '#004e5c'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#0f131c'
  on-background: '#dfe2ef'
  surface-variant: '#31353f'
typography:
  display-lg:
    fontFamily: inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.025em
  display-lg-mobile:
    fontFamily: inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: 0em
  body-md:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  code-lg:
    fontFamily: jetbrainsMono
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: -0.01em
  code-md:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  code-sm:
    fontFamily: jetbrainsMono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-md:
    fontFamily: jetbrainsMono
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: jetbrainsMono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  space-2xs: 0.125rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-base: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  gutter-desktop: 1.5rem
  margin-desktop: 2rem
  gutter-tablet: 1rem
  margin-tablet: 1.5rem
  gutter-mobile: 0.75rem
  margin-mobile: 1rem
---

## Brand & Style

This design system establishes a high-density, analytical environment tailored for computational pharmacologists, neurochemists, and drug discovery teams. The visual language conveys rigorous clinical authority, biochemical precision, and explainable intelligence. 

The aesthetic fuses **Modern Technical Minimalist** and **Precision Glassmorphic** idioms:
- Ultra-deep obsidian and subterranean navy backdrops eliminate optical fatigue during long multi-parameter modeling sessions.
- Luminescent cyan and bioluminescent teal serve as functional beacons for high-confidence predictions, blood-brain barrier (BBB) penetration viability, and positive predictive pathways.
- Subdued spectral violets demarcate deep learning infrastructure, latent chemical embeddings, and uncertainty quantification.
- Translucent frosted structural planes with whisper-weight micro-borders evoke high-end laboratory microscopy lenses, optical cryo-EM readouts, and dry-lab computational instrumentation.

## Colors

The palette operates on a strict functional taxonomy calibrated for high-contrast data visualization in dark environments:

### Core Canvases & Structural Tones
- **Canvas Base:** `#0a0e17` (Deep Obsidian) — Fundamental application ground.
- **Surface Elevation 1 (Containers/Drawers):** `#0f172a` (Subterranean Navy) — Primary structural layer.
- **Surface Elevation 2 (Inspectors/Overlays):** `#162032` (Deep Slate) — Elevated analytical panels.
- **Border Subtle:** `rgba(255, 255, 255, 0.08)` — Standard separation vector.
- **Border Active/Focused:** `rgba(6, 182, 212, 0.45)` — Active analytical state.

### Primary Accents & Signals
- **Permeable / Positive Drivers (Primary / Tertiary):** `#06b6d4` (Cyan Photon), `#14b8a6` (Teal Luminescence), and `#10b981` (SHAP Positive Emerald). Used for positive feature attribution (+logBB, high BBB+ likelihood), active state indicators, and primary action targets.
- **Latent Embeddings / Model Infrastructure (Secondary):** `#8b5cf6` (Spectral Violet) and `#a78bfa` (Periwinkle Glow). Reserved for neural attention weights, SMILES token encoders, and uncertainty distributions.
- **Non-Permeable / Negative Deterrents (Critical):** `#f43f5e` (Crimson Deterrent) and `#f59e0b` (Amber Alert / Borderline Efflux P-gp substrate signals).

### Text Hierarchy
- **Text High-Contrast:** `#f8fafc` (Molecular White) — 98% brightness for metrics, primary labels, and active SMILES strings.
- **Text Secondary:** `#94a3b8` (Muted Slate) — Field metadata, parameter labels, unit scales.
- **Text Tertiary / Disabled:** `#475569` (Sub-Slate) — Inactive states, baseline guides.

## Typography

Typography balances clinical legibility with raw cryptographic and chemical accuracy:

- **Primary Interface Font (`Inter`):** Assigned to structural controls, conversational context, narrative insights, and high-level analytical metrics. Tabular numbers (`tnum`) must be toggled on across all statistical displays.
- **Computational & Chemical Engine (`JetBrains Mono`):** Dedicated to molecular strings (SMILES, InChI, FASTA), atomic coordinates, numerical metrics (logP, TPSA, MW, HBD, HBA), SHAP importance values, and status micro-tags.
- **Case Rules:** All micro-labels (`label-md`, `label-sm`) use uppercase styling with expanded letter spacing to ensure immediate scannability across dense data grids.

## Layout & Spacing

The architecture deploys an asymmetric 12-column analytical workstation grid optimized for simultaneous display of molecular 2D/3D viewers, SHAP feature waterfalls, and real-time inferencing logs:

- **Desktop Layout (>= 1280px):** 12-column grid. Standard structural breakdown:
  - Left Dock (3 columns / 280px–340px min): Molecule ingestion, SMILES input, physicochemical property inputs.
  - Core Canvas (6 columns): 3D conformer viewer & latent feature embedding projection.
  - Right Inspector (3 columns / 320px–400px): Explainable AI waterfall, SHAP contribution list, P-glycoprotein efflux liability ratings.
- **Tablet (768px – 1279px):** Split 8-column setup; molecule input and structure preview stacked above side-by-side attribution panels.
- **Mobile (< 768px):** Strict 4-column single-axis scroll layout. Molecular view scales to a fixed 1:1 aspect ratio card; chemical property tokens transform into horizontal scroll carousels.
- **Internal Component Spacing:** Based on a rigid 4px/8px baseline rhythm. High-density cards use `space-md` (12px) padding to maximize information density without structural crowding.

## Elevation & Depth

Visual hierarchy uses frosted transmission, edge luminescence, and optical absorption rather than conventional physical drop shadows:

- **Layer 0 (Base Abyssal Ground):** `#0a0e17` solid. Non-interactive background with an optional faint radial gradient (`rgba(6, 182, 212, 0.03)` at center) to denote active computation.
- **Layer 1 (Sub-surface Panels):** Background `rgba(15, 23, 42, 0.65)`, backdrop-filter `blur(16px)`, border `1px solid rgba(255, 255, 255, 0.06)`.
- **Layer 2 (Floating Inspect Tooltips / Popovers):** Background `rgba(22, 32, 50, 0.85)`, backdrop-filter `blur(24px)`, border `1px solid rgba(6, 182, 212, 0.25)`, shadow `0 8px 32px -4px rgba(0, 0, 0, 0.60)`.
- **Layer 3 (Modal Scrims / Global Overlays):** Modal surface `#0f172a` enclosed in `1px solid rgba(139, 92, 246, 0.35)`, over an obsidian scrim (`rgba(10, 14, 23, 0.85)` with `blur(8px)`).
- **Luminescence / Optical Bloom:** Active states and positive BBB+ high-confidence badges cast a subtle glow: `box-shadow: 0 0 20px -2px rgba(6, 182, 212, 0.25)`.

## Shapes

The design system employs **Soft (Level 1)** geometry to reflect clinical instrumentation and industrial scientific monitors:

- **Standard Elements (Buttons, Inputs, Badges):** `4px` (`0.25rem`) corner radius. This conveys sharp precision and technical density.
- **Surfaces and Panels (`rounded-lg`):** `8px` (`0.5rem`) corner radius for high-level viewport windows, molecular visualization canvases, and SHAP cards.
- **Modal Viewports & System Sheets (`rounded-xl`):** `12px` (`0.75rem`) maximum radius.
- **Data Indicator Nodes:** Full circular radius (`9999px`) strictly limited to atomic structure nodes, status pings, and confidence gauge indicators.

## Components

### Buttons
- **Primary (Inference Execution):** Background linear gradient `135deg, #06b6d4 0%, #14b8a6 100%`, text `#0a0e17`, font weight 600, border `1px solid rgba(255, 255, 255, 0.2)`. Hover: `box-shadow: 0 0 16px rgba(6, 182, 212, 0.4)`.
- **Secondary (Parameter Tuning):** Background `rgba(15, 23, 42, 0.8)`, text `#f8fafc`, border `1px solid rgba(255, 255, 255, 0.12)`. Hover: border `rgba(6, 182, 212, 0.5)`, text `#06b6d4`.
- **Ghost/Tertiary:** Transparent ground, text `#94a3b8`. Hover: text `#f8fafc`, background `rgba(255, 255, 255, 0.04)`.

### Inputs & SMILES String Fields
- Container: Background `rgba(10, 14, 23, 0.75)`, border `1px solid rgba(255, 255, 255, 0.1)`, padding `8px 12px`.
- Typography: `code-md` (`JetBrains Mono`), text `#f8fafc`.
- Focus state: Border color `#06b6d4`, subtle cyan aura (`0 0 0 1px #06b6d4`).
- Chemical Validation State: Real-time inline indicator badge showing "Valid RDKit Mol" (Emerald `#10b981`) or "Invalid Valence" (Crimson `#f43f5e`).

### SHAP Feature Contribution Bars
- Bipolar horizontal layout anchored at midpoint baseline $x = 0$.
- **Permeable Drivers (+):** Solid bar gradient from `#14b8a6` to `#06b6d4`, terminating with a precise `+0.xx` value tag in `code-sm`.
- **Deterrent Drivers (-):** Solid bar `#f43f5e` pulling leftward, terminating with `-0.xx`.
- Background guide: Track width filled with 5% white hash-lines; zero-axis marked with a solid 1px line of `rgba(255, 255, 255, 0.25)`.

### Molecular Property Chips / Pills
- Compact metadata blocks (MW, TPSA, LogP, HBD, HBA):
- Background `rgba(22, 32, 50, 0.6)`, border `1px solid rgba(255, 255, 255, 0.08)`, border-radius `4px`.
- Layout: Top label in `label-sm` muted slate (`#94a3b8`); numeric value underneath in `code-md` (`#f8fafc`).

### Selection Controls (Checkboxes & Radios)
- Box: 16x16px, background `rgba(10, 14, 23, 0.8)`, border `1px solid rgba(255, 255, 255, 0.2)`, radius `3px`.
- Checked: Background `#06b6d4`, border `#06b6d4`, glyph color `#0a0e17`.

### Cards & Analytical Viewports
- Outer boundary wrapped in `1px solid rgba(255, 255, 255, 0.07)`.
- Header strip: Integrated sub-bar with surface `#0f172a`, height `36px`, bearing an uppercase `label-md` section name, live compute timestamp, and latency badge (`<12ms`).