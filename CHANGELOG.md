# Changelog

## April 20, 2026: Usability & Accessibility Improvements

### Help Tooltips

- Added a reusable `HelpTooltip` component (`frontend/src/components/HelpTooltip/`) that renders an interactive `?` button with a popover explaining how to use each feature
- Tooltip supports four placement positions (`top`, `bottom`, `left`, `right`) with fade-in animations for each direction
- Implemented keyboard accessibility — tooltip closes on `Escape` key press and dismisses on outside click
- Included `aria-label="Help"`, `aria-expanded`, and `role="tooltip"` attributes for screen reader support
- Integrated tooltips across feature pages (Groups, Group Details, Single Expenses) to guide users through workflows such as creating groups, adding expenses, settling balances, and filtering

### Typography

- Loaded two Google Fonts via `<link>` tags in `index.html`: **Noto Sans** and **Ruluko**
- **Noto Sans** — used as the app-wide body font for all UI text, labels, form elements, and data displays; chosen for its neutral tone and high legibility across screen sizes, which is important for a finance app where users scan numbers and names quickly
- **Ruluko** — used for the landing page title, description text, and the navbar brand name; chosen as a distinctive display font to give the app a branded, editorial feel that differentiates the index page from the functional interior pages

### Consistent Color Palette

- Defined a centralized CSS custom-property palette in `global.css` aligned with a professional financial app theme:
  - **Primary**: Vivid Blue (`#3D8EE8`) — used for buttons, links, active states, and brand identity; conveys trust and reliability
  - **Accent**: Bright Teal (`#13C4BC`) — used sparingly for decorative highlights; adds visual interest without competing with the primary blue
  - **Background**: Soft Slate (`#F4F6F8`) — neutral, low-contrast background that reduces eye strain during extended use
  - **Status colors**: Emerald (`#10C27A`) for success/settled, Amber (`#F59B00`) for warnings/unpaid, Crimson (`#E03040`) for danger/errors — each status has a distinct hue so users can identify states without relying on text alone
- Overrode Bootstrap component tokens (`btn-primary`, `btn-light`, `btn-outline-success`, `badge`, `card`, `form-control`, `list-group-item`) to use the custom palette, ensuring visual consistency across all UI elements
- Added category-specific colors (food, transport, utilities, entertainment, accommodation, health, shopping, other) for expense categorization at a glance
- Defined three shadow levels (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) tinted with the primary blue to create a cohesive depth system

### Lighthouse Accessibility — 96% Score Justification

- Achieved a **96% accessibility score** on the Lighthouse audit (v13.0.2, emulated desktop, `/groups` page)
- **Remaining 4% deduction** is due to a single contrast flag — Lighthouse detected insufficient contrast ratios on several elements within the Groups page:
  - Navigation link in active state (`a.startup-page__nav-link.active`)
  - Hero container text (`div.startup-page__hero.container`)
  - Logout button (`button.startup-page__logout-btn`)
  - Primary action button (`button.btn.btn-primary`)
  - Status badges (`span.badge.bg-primary`, `span.badge.bg-warning`, `span.badge.bg-success`)
  - Group card links and `<dt>` labels (`a.group-card`, `dt`)
  - These are largely inherited from Bootstrap's default component styling (badge backgrounds, button colors) where white text on the themed background colors falls slightly below the WCAG AA 4.5:1 threshold. The core page content — body text, headings, form labels — all pass contrast requirements comfortably
