# CSS Variable Audit

## 1. Theme Variables Assessment
- **Set:** All core theme variables are correctly defined for both light and dark modes.
    - `--color-bg`
    - `--color-surface`
    - `--color-surface-hover`
    - `--color-border`
    - `--color-text-main`
    - `--color-text-muted`
    - `--color-accent`
- **Integrity:** There are no missing variables in the `.dark` override block.
- **Unused Variables:** All defined variables are primary theme tokens. While not all might be explicitly used in the small `index.css` file, they are the base tokens for the Tailwind v4 `@theme` configuration and are consumed via Tailwind utility classes (e.g., `bg-bg`, `text-text-main`) throughout the React components.

## 2. Global Styles & Utilities
- **Focus States:** Correcty uses `--color-accent` for `:focus-visible`.
- **Selections:** Correcty uses a transparent version of the emerald accent.
- **Dot Grid:** Correctly implements theme-aware background gradients for the hero pattern.

## 3. Observations
- The design system uses an emerald/green accent (`#10B981`) as the CSS variable, which contrasts with the user's initial mention of a "blue-500 accent". However, the CSS variables are consistent with the rendered UI and the Relay branding.
- The use of `rgba(255, 255, 255, 0.08)` for dark mode borders is a high-quality detail that provides better visual integration than a solid hex code.

No bugs or missing definitions found.
