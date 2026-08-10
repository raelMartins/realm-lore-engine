# Realm Lore Engine

A modular, schema-driven **campaign map engine** for interactive TTRPG-style lore.

Realm Lore Engine turns structured world data into a living dual-isle atlas: travelers pan and zoom a parchment map, open lore cards, chase secrets, and watch the realm react when an alliance is forged. Content is not hard-wired into the UI — pins, realms, and copy are parsed from a typed lore schema and rendered dynamically, so each deployment can load a different shore without rebuilding the cartography shell.

## The story of the map

Two isles face each other across a narrow channel.

- **Adventurer's Reach** (west) holds the traveler's path: craft, relics, jobs, and whispered easter eggs.
- **Guild Shore** (east) holds the campaign's living world: characters, projects, achievements, and quests charted from deployment content.

Explore pins, flip parchment cards, hunt secrets on the ridge, and — when the moment is right — forge an alliance. Trails of skill cross the water; accents shift; the map becomes one realm for a while.

Under the fantasy veneer sits an engine: typed pin categories, coordinate-aware placement, world documents keyed by `WORLD_ID`, and optional Turso-backed guild content so multiple campaign shores can share one database.

## What it does

- **Schema-driven lore** — Characters, jobs, projects, achievements, quests, and secrets follow a shared `LorePin` model (title, subtitle, coordinates, content blocks, links, dates).
- **Spatial campaign map** — Zoom/pan atlas with realm hit regions, typed map pins, and parchment lore drawers.
- **Modular worlds** — West-isle adventurer content ships in-repo; east-isle guild content loads from Turso (or local fallback) per `WORLD_ID`.
- **Guild charting** — Stewards with a passphrase can place new east-isle pins on land (validated placement, pin caps, spacing).
- **Alliance cinematic** — Portal crossing, transfer trails, and accent morph when the realms unite.
- **Exploration & secrets** — Progress tracking, Konami / ridge secrets, and optional embedded media on special nodes.
- **Visit charting** — Optional private `/tracking` dashboard for named exploration events (secret-gated).

## Stack

- [Next.js](https://nextjs.org) (App Router) · React · TypeScript
- Tailwind CSS · Framer Motion · Lucide
- Turso / libSQL for world documents and visit events
- react-zoom-pan-pinch for map navigation

## Getting started

```bash
npm install
cp .env.example .env.local
```

Fill in Turso credentials (and optional secrets) in `.env.local`, then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful env knobs

| Variable | Role |
| --- | --- |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | World + tracking storage |
| `WORLD_ID` | Which east-isle world document this deploy loads |
| `GUILD_EDIT_KEY` | Passphrase for charting guild pins |
| `NEXT_PUBLIC_SCHEDULING_URL` | Public scheduling link for quest CTAs |
| `TRACKING_SECRET` | Unlock `/tracking` |
| `DEV_SEED_SECRET` | Local-only bulk seed guard |

See `.env.example` for the full list.

### Seeding a guild shore (local)

With `npm run dev` running and `DEV_SEED_SECRET` set:

```bash
npm run seed:world -- seeds/example-guild-world.json
```

Private campaign payloads can live under `seeds/private/` (gitignored). Point `WORLD_ID` at the seeded world id, refresh the map, and the east isle redraws from schema.

## Project shape (high level)

```text
src/
  app/                 # Routes, including map home + /tracking
  components/          # Map canvas, lore drawer, guild charting, alliance FX
  config/              # Default west-isle world + avatars + realm paths
  lib/
    world/             # Load, seed, place, and normalize world pins
    db/                # Schema + Turso client
    tracking/          # Visit event helpers
  types/world.ts       # Lore schema (pins, realms, content blocks)
```

## License

Private project — all rights reserved unless otherwise noted.
