# Flowser — Visual Design Spec

For implementation with Tailwind CSS + shadcn-vue + vue-flow

## 1. Fonts

| Role    | Family                      | Usage                                                          |
| ------- | ---------------------------- | --------------------------------------------------------------- |
| Display | Space Grotesk (600/700)      | Page titles, node titles, card titles, wordmark                 |
| Mono    | IBM Plex Mono (400/500/600)  | Meta rows, node subtitles, breadcrumbs, badges, nav labels       |
| Body    | Inter (400/500/600)          | Body copy, buttons, inputs                                      |

## 2. Color tokens

All neutrals use OKLCH with hue ≈45–60 (warm). Accent is tweakable per-brand; default is orange.

| Token          | Dark                    | Light                    |
| -------------- | ------------------------ | -------------------------- |
| bg             | `oklch(0.17 0.014 45)`   | `oklch(0.975 0.006 60)`    |
| surface        | `oklch(0.215 0.014 45)`  | `#ffffff`                  |
| surface-raised | `oklch(0.245 0.015 45)`  | `#ffffff`                  |
| border         | `oklch(0.33 0.015 45)`   | `oklch(0.9 0.006 60)`      |
| border-soft    | `oklch(0.28 0.014 45)`   | `oklch(0.93 0.006 60)`     |
| text           | `oklch(0.95 0.008 60)`   | `oklch(0.19 0.01 60)`      |
| text-muted     | `oklch(0.62 0.015 60)`   | `oklch(0.52 0.012 60)`     |
| canvas-bg      | `oklch(0.14 0.012 45)`   | `oklch(0.965 0.006 60)`    |
| canvas-dot     | `oklch(0.26 0.014 45)`   | `oklch(0.89 0.006 60)`     |

### Accent + node category colors

| Category           | Formula                       | Used for                          |
| ------------------- | ------------------------------ | ----------------------------------- |
| trigger / accent    | `#f4741f` (brand, swappable)   | Primary buttons, trigger nodes, logo |
| core                | `oklch(0.72\|0.56 0.15 253)`   | If, Code, logic nodes               |
| browser             | `oklch(0.72\|0.56 0.15 196)`   | Tab / browser-control nodes         |
| data                | `oklch(0.72\|0.56 0.15 150)`   | Data Table / storage nodes          |
| action              | `oklch(0.72\|0.56 0.15 322)`   | Page-action nodes                   |

First lightness value = dark mode, second = light mode. Success/active green is fixed: `#1db954`.

## 3. Shape & elevation

- Radii are sharp, not rounded-pill: **3px** buttons/inputs, **4–6px** cards/panels, **2px** switches (flat, not pill-shaped).
- Borders: 1px solid, always the border token — never shadows alone to define edges.
- Node card left-edge stripe: 3px wide, category color, 10px inset top/bottom, 2px radius.
- Shadows: cards flat (border only); floating panels (Add Node) use dark `0 12px 32px rgba(0,0,0,.5)` / light `rgba(0,0,0,.12)`.

## 4. Component patterns

- **Page title**: `text-3xl font-bold tracking-tight font-display` (30px, Space Grotesk 700) — used for the top-level `<h1>` on Workflows, Data Tables, Credentials, Executions, Settings, and the Data Table detail view.
- **Page container**: `p-8` outer padding with `mb-8` below the title/header row before the page's main content — used on Workflows, Data Tables, Credentials, Executions, Settings, and the Data Table detail view.
- **Page header row**: `flex items-start justify-between` (never `items-center`) — the title's line-height (36px) matches the default `Button` height (36px), so top-aligning keeps the action button's position identical whether or not the title has a subtitle underneath it.
- **Primary button**: accent fill, dark text (#180d02 on orange), 700 weight, 3px radius, no shadow.
- **Outline button**: 1px border, transparent/surface bg, 600 weight text.
- **Switch (Active toggle)**: flat 2–3px-radius track (not pill), 38×20 or 32×18, thumb inset 2px, on-color = accent (sidebar) or #1db954 (Active state).
- **Workflow card**: 1px border, thumbnail area with dot-grid bg (16px grid) showing a mini flow preview or skeleton bars, footer row = Active switch + Execute outline button.
- **Node card**: surface-raised bg, 1px border, 6px radius, 34×34 category-color icon chip with a plain white glyph (circle = trigger, diamond = logic, square = action/data — never detailed icons), title in Space Grotesk 600, subtitle in mono.
- **Edge**: cubic bezier, 2px stroke in source node's category color, 4px port dots at each end; TRUE branch gets a small mono badge, category-colored fill.
- **Add-node affordance**: dashed connector + circular "+" stub at any dangling output port.

## 5. Tailwind config extension

```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      bg: { DEFAULT: 'oklch(0.975 0.006 60)', dark: 'oklch(0.17 0.014 45)' },
      surface: { DEFAULT: '#ffffff', dark: 'oklch(0.215 0.014 45)' },
      border: { DEFAULT: 'oklch(0.9 0.006 60)', dark: 'oklch(0.33 0.015 45)' },
      muted: { DEFAULT: 'oklch(0.52 0.012 60)', dark: 'oklch(0.62 0.015 60)' },
      accent: '#f4741f',
      node: {
        core: 'oklch(0.56 0.15 253)',
        browser: 'oklch(0.56 0.15 196)',
        data: 'oklch(0.56 0.15 150)',
        action: 'oklch(0.56 0.15 322)',
      },
    },
    fontFamily: {
      display: ['"Space Grotesk"', 'sans-serif'],
      mono: ['"IBM Plex Mono"', 'monospace'],
      sans: ['Inter', 'sans-serif'],
    },
    borderRadius: { sm: '3px', DEFAULT: '4px', md: '6px' },
  },
}
```

## 6. shadcn-vue notes

- Override shadcn's default `--radius` CSS var to `0.1875rem` (3px) globally — this is the biggest visual shift from stock shadcn's rounded look.
- `Button` variant "default" → accent bg + dark text; "outline" → border token, no fill.
- `Switch`: pass `class="rounded-[3px]"` to flatten the stock pill shape; thumb also square-ish (rounded-[2px]).
- `Card`: set `border` token, drop default shadow.

## 7. Vue Flow overrides

```css
/* vue-flow theme overrides */
.vue-flow {
  --vf-node-bg: oklch(0.245 0.015 45);
  --vf-node-color: oklch(0.95 0.008 60);
  --vf-connection-path: var(--node-accent, #f4741f);
  --vf-handle: var(--node-accent, #f4741f);
  background: oklch(0.14 0.012 45);
}
.vue-flow__node {
  border: 1px solid oklch(0.33 0.015 45);
  border-radius: 6px;
  border-left: 3px solid var(--node-accent);
  font-family: 'Space Grotesk', sans-serif;
}
.vue-flow__edge-path { stroke-width: 2; }
.vue-flow__handle {
  width: 8px; height: 8px; border-radius: 50%;
  border: 2px solid oklch(0.14 0.012 45);
}
/* per-node-type accent, set on each node's wrapper */
.node-core     { --node-accent: oklch(0.72 0.15 253); }
.node-browser  { --node-accent: oklch(0.72 0.15 196); }
.node-data     { --node-accent: oklch(0.72 0.15 150); }
.node-action   { --node-accent: oklch(0.72 0.15 322); }
.node-trigger  { --node-accent: #f4741f; }
```

## Reference implementation

- Tokens, fonts, radius scale: `assets/style.css`
- Category color → CSS var wiring: `.node-*` rules in `assets/style.css`, resolved via `lib/nodes/nodeCategory.ts`
- shadcn primitives: `components/ui/button`, `components/ui/input`, `components/ui/card`, `components/ui/switch`
- Node cards & edges: `components/editor/NodeDelegate.vue`, `components/editor/CustomEdge.vue`
- Vue Flow canvas overrides: `entrypoints/main/views/WorkflowEditorView.vue`
- Workflow list cards: `entrypoints/main/views/WorkflowsView.vue`
- Popup: `entrypoints/popup/App.vue`, `entrypoints/popup/components/WorkflowItem.vue`
