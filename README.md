# Aura Data Mapping

<!-- github-organisation:start -->

## Project links and history

- First substantive build: 28 June 2026.
- GitHub repository: [aura-data-mapping](https://github.com/auraofintelligence/aura-data-mapping).
- Public site: [visit the public site](https://auraofintelligence.github.io/aura-data-mapping/).

## Related public projects

Each link below reflects an evidenced family, lineage or direct connection. This project has 8 relevant public connections.

### Aura interface, geometry and capture architecture

- [aura-components](https://github.com/auraofintelligence/aura-components) - [public page](https://auraofintelligence.github.io/aura-components/) - later build; aura-components is earlier, explicit cross-reference, ordered build lineage, shared technical architecture.
- [aura-horn-torus](https://github.com/auraofintelligence/aura-horn-torus) - [public page](https://auraofintelligence.github.io/aura-horn-torus/) - earlier build; aura-horn-torus is later, explicit cross-reference, ordered build lineage, shared technical architecture.
- [aura-of-intelligence-web-app](https://github.com/auraofintelligence/aura-of-intelligence-web-app) - shared technical architecture.
- [aura-scan-pipeline](https://github.com/auraofintelligence/aura-scan-pipeline) - [public page](https://auraofintelligence.github.io/aura-scan-pipeline/) - shared technical architecture.
- [aura-spatial-perception](https://github.com/auraofintelligence/aura-spatial-perception) - [public page](https://auraofintelligence.github.io/aura-spatial-perception/) - earlier build; aura-spatial-perception is later, ordered build lineage, shared technical architecture.
- [aura-toy](https://github.com/auraofintelligence/aura-toy) - [public page](https://auraofintelligence.github.io/aura-toy/) - later build; aura-toy is earlier, explicit cross-reference, ordered build lineage, shared technical architecture.
- [new-tori](https://github.com/auraofintelligence/new-tori) - [public page](https://auraofintelligence.github.io/new-tori/) - later build; new-tori is earlier, ordered build lineage, shared technical architecture.

### Direct and other supported connections

- [aura-affinity](https://github.com/auraofintelligence/aura-affinity) - [public page](https://auraofintelligence.github.io/aura-affinity/) - explicit cross-reference.

<!-- github-organisation:end -->

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
