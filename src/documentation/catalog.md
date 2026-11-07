# Catalog

`itemCategory` and `unitCategory` retain membership for complete category indexes. `itemPage` and `unitPage` choose one canonical page for each full entry. Elemental spirits belong to Elements, plants to Plants, containers to Containers, and worm and fish items to Animals. Other category indexes link to those pages. Redirected index members retain their previous anchor IDs.

`itemVariants` starts with crafting, brewing, trading, building and unit equipment/drop definitions. Configured forge bases and their reachable upgrade results are included through `getForgeOptions`. Variants need a real inventory sprite and meaningful balancing stats, or a functional consumable, map or compass definition. Unsupported artwork is not treated as an available tier.

`unitGroups` combines material and color variants through the actual sprite name or source family key. Chests share a family, as do colored prisms, eyes and orbs. All source keys remain available for references.

`previewItem` supplies the canonical command item's default material for an untiered equipment portrait. Zero-amount weapons stay hidden, matching concealed melee claws. `getEffectSprite` uses the real particle templates for bolt and blast actions, which have no inventory icons.
