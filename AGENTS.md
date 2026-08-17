# AGENTS.md

## Commands

```sh
npm run dev          # dev server (vite)
npm run build        # type-check → build-only (removes dist/ first)
npm run type-check   # vue-tsc --build (NOT tsc — .vue files)
npm run lint         # eslint . --fix
npm run format       # prettier --write src/
```

**Build order matters**: `build` removes `dist/` with `fs.rmSync`, then runs `type-check` + `build-only` in parallel. Vite config has `build.emptyOutDir: false` — the rm step is manual because of this.

## Architecture (must follow)

Strict unidirectional dependency: `tools → data → save/access → compute → logic → meta → ui`. No imports going upward.

- **`compute/` is read-only**: functions take state as input, return results, never mutate.
- **`logic/` is where mutations happen** (purchases, resets, automations).
- **`effects.ts` is the central buff pipeline**: every numeric modifier (cost, production, reset gain, etc.) goes through `registerEffect`/`calculate`. New systems MUST register effects here, never bake bonuses into core formulas.

See `PROJECT.md` for the full directory map and layer/reset design.

## Gotchas

### Numbers
- **All game numbers use `Decimal` from `break_eternity.js`**. Never use plain JS `number` for player state, costs, or production.
- Decimals are NOT JSON-serializable. The save system uses `markDecimals` (→ `{$d: "..."}`) / `unmarkDecimals` on save/load.

### Save system
- Custom serialization in `save/save.ts`. Checksums are **disabled** (`0 && check(...)` in save.ts — do not re-enable without a redesign).
- No backwards compatibility for old saves (migration.ts is empty).

### Type system
- `vue-tsc` handles `.vue` type-checking; plain `tsc` will fail on `.vue` imports.
- `@/` alias → `src/` (configured in both tsconfig and vite).

### Lint/format rules
- **No semicolons**, **single quotes**, max line width 100 (Prettier).
- Unused variables: prefix with `_` to suppress ESLint error.
- `vue/multi-word-component-names` is off.

### UI conventions
- Button classes come in pairs: **type** (sizing: `subTab`, `prestige`, `buyable`, `upgrade`, `mainTab`, `toggle`) + **state** (color: `selected`, `affordable`, `bought`, `toggle-on`, `toggle-off`, `meta`). All defined in `src/assets/style.css`.
- Theme colors: use `var(--...)` CSS variables from `:root` / `body.light`. Add new themes by extending the theme cycle in `settings.ts` + adding the corresponding CSS variables.

### Code style
- **Chinese JSDoc comments above every new function**.
- **Registry pattern** for all game systems: define an array (`UPGRADES`, `BUYABLES`, `AUTOMATIONS`, achievements), register at module level, query via accessor functions.
- **Pure functions with no save/effect dependencies go in `tools/`** (e.g. `softCapValue`). Gameplay-aware wrappers (reading effect slots/player state) live in `compute/`.

## No tests
This project has no test suite. Verify changes by running `npm run type-check && npm run lint && npm run build`.
