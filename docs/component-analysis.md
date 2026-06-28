# Aura Builder Component Analysis

## Source inspected

- Local repo: `C:\Users\lukec\Documents\GitHubLocal\aura-components`
- Remote: `https://github.com/auraofintelligence/aura-components`
- Commit inspected: `d7f6c97a2b6e60e78f80e0b36b5e58265ee028d2`
- Main file: `index.html`

## What the existing component does

The existing repo is a single-file web app. The Aura Builder is only one page inside that larger file.

Its core Aura Builder behaviour is:

- Create a 12 x 24 grid using `COLS = 24`, `ROWS = 12` and `CELL_SIZE = 20`.
- Draw the grid into a canvas texture.
- Apply that texture to two Three.js planes: `insidePlane` and `outsidePlane`.
- Put both planes into a `Torus` class for each chakra colour.
- Use raycasting to detect which grid cell the user clicked.
- Store clicked facets in `selectedCells.inside` and `selectedCells.outside`.
- Redraw the texture so selected cells become highlighted.
- Save/load only those selected cell co-ordinates in browser `localStorage`.

In plain terms: each square could be switched on or off, but the square could not remember what it meant.

## Useful parts to keep

- The 12 x 24 matrix matches the Aura PDF source.
- The seven chakra-coloured layers are already simple and useful.
- The inside/private and outside/public split is clear.
- Three.js raycasting is a good fit for clicking cells on either the flat matrix or torus.
- Canvas textures are flexible, because a data-backed cell can be drawn with different colours and states without creating hundreds of DOM elements.
- The flat-to-torus animation is worth preserving because it gives the Aura field its distinctive behaviour.

## Main limits

- The repo is all in one `index.html`, so the Aura Builder is mixed with Avatar Builder, Timeline Mastery, Memory Palace, Social Media, Algorithm Settings, File Storage and Internet of Things pages.
- The selected state is only a `Set` of strings like `12-4`.
- The save format only stores selected inside/outside co-ordinates.
- There is no data model for links, documents, jobs, notes, ownership, status, cadence or source provenance.
- There is no inspector panel for editing the meaning of a facet.
- There is no JSON export/import for moving the map into a durable source file later.

## New data model

The replacement app treats each facet like a small address book entry.

The key is:

```text
layer|shell|x|y
```

Example:

```text
3|outside|4|5
```

The record is:

```json
{
  "title": "GAJRA.Earth public field",
  "type": "website",
  "target": "https://GAJRA.Earth",
  "status": "seed",
  "cadence": "Live site",
  "tags": "public, earth, community",
  "notes": "Example outside/public mapping for a living website.",
  "updatedAt": "2026-06-28T00:00:00.000Z"
}
```

This keeps the old visual idea, but upgrades the purpose: a highlighted facet becomes a quick access field for information.
