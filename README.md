# Aura Data Mapping

A standalone version of the Aura Builder component focused on data-backed facets.

The original builder let a person click a 12 x 24 matrix facet and turn it into a highlight. This version keeps the Aura field, the seven ROYGBIV layers, and the inside/private versus outside/public split, but each mapped facet can now hold a small data record.

That record can point to a living website, document, scheduled job, repository, dataset, prompt, contact or other quick-access item.

## Public page

https://auraofintelligence.github.io/aura-data-mapping/

## Run locally

From this folder:

```powershell
python -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

## What changed from aura-components

- The old `selectedCells` sets have been replaced by a keyed mapping store.
- Each key follows `layer|shell|x|y`, for example `3|outside|4|5`.
- Each key can hold `title`, `type`, `target`, `status`, `cadence`, `tags`, `notes` and `updatedAt`.
- The 12 x 24 field still renders through Three.js canvas textures.
- The torus formation animation is preserved in simplified form.
- Data is saved to browser `localStorage`.
- JSON export/import is included so the map can move between machines or become a future source file.

## Source notes

This repo is derived from the Aura Builder component in `auraofintelligence/aura-components` and has been republished as a standalone Aura Data Mapping prototype.

The supplied Aura of Intelligence PDF supports the key design anchors used here: a 12 x 24 matrix for linking objects, seven chakra-coloured layers, and the inside/private plus outside/public shell distinction.

## Licence

Public non-commercial learning, reference, study and adaptation are welcome with attribution. Commercial use is reserved to Luke Hayes / Aura of Intelligence and requires written permission. See [LICENSE](LICENSE).
