# Final catalog visual inspection

No new visual defect was found. Source remained unchanged during this check. The capture browser is closed.

Inspected Gear, Plants, Units and Enemies at 1440×1000 and 390×1000. There were 22 targeted visits and 41 screenshots, including lower content and horizontal comparison endpoints. Every screenshot was reviewed through six contact sheets, with full-size checks of the enlarged sprites and native frames. The visit log contains no runtime errors or missing targets.

| Area | Result |
| --- | --- |
| Complementary half-cell font rendering | Sword, Torch, Tree, Palm, Rotten, Sign and Bandit pixels retain solid color areas, clean boundaries and their native shapes. No line seams, broken cells or stray marks were visible. |
| Batched preview cells | All sampled enlarged portraits render as native font runs, with zero SVG elements in their LargePreview regions. Horizontal endpoint views keep the same pixel alignment. |
| Native frame spaces | Green Contents borders and white tab labels remain continuous. Compact quest, collect, forging and drop frames have matching sides and corners; removing transparent space layers did not expose gaps or cover labels. |
| Responsive comparison tables | Phone views scroll locally to later variants. Header words remain intact, native icons and counts stay together, and the fixed header stays readable. |
| Catalog requirements | Sign is under Units; Golem Limb stays a one-cell native icon in Adds; unit attacks share one Damage row. Torch and Boots retain their accessory upgrades. Plants retains both living Tree/Palm choices, fruit layers, all native Stump/Husk/Desert Husk choices, and the full enlarged Rotten body. |

The rendering reviewed is the complementary `▀`/`▄` path in `src/components/Row/index.tsx` and native frame-space filtering in `src/wiki/visuals.tsx`. The enlarged portraits still use the existing font masks and two source pixels per character through `LargePreview`.

Screenshots and the machine-readable visit log are in `/tmp/alive-catalog-final-font-visual`. Filenames use the target index and viewport width; `-right` marks the horizontal endpoint and `-lower` marks lower content. Useful full-size samples:

- `0-1440.png`: Gear Contents and native quest frames.
- `1-1440.png`: Sword pixels, equipped Scout and forging frames.
- `2-390-right.png`: later Torch upgrades and a narrow native frame.
- `3-1440-right.png`: both Stump choices beside living Tree variants.
- `4-390-right.png`: both Desert Husk choices.
- `5-390-right.png`: the full Rotten comparison's right side.
- `7-390.png`: Sign pixels and its compact native drop frame.
- `8-1440.png`: Enemies Contents with separate Adds and Elites.
- `9-390-right.png`: related Bandit portraits and their single Damage row.

No tests or build were run for this read-only inspection. Root owns the final aggregate verification and route audit.
