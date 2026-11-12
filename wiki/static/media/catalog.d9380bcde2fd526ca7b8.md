# Catalog

`itemCategory` and `unitCategory` retain membership for complete category indexes. `itemPage` and `unitPage` choose one canonical page for each full entry. Elemental spirits belong to Elements, plants to Plants, containers to Containers, and worm and fish items to Animals. Other category indexes link to those pages. Redirected index members retain their previous anchor IDs.

`itemVariants` starts with crafting, brewing, trading, building and unit equipment/drop definitions. Configured forge bases and their reachable upgrade results are included through `getForgeOptions`. Variants need a real inventory sprite and meaningful balancing stats, or a functional consumable, map or compass definition. Unsupported artwork is not treated as an available tier.

`unitGroups` combines material and color variants through the actual sprite name or source family key. Chests share a family, as do colored prisms, eyes and orbs. All source keys remain available for references.

`previewItem` supplies the canonical command item's default material for an untiered equipment or consumable portrait. Zero-amount weapons stay hidden, matching concealed melee claws. `getEffectSprite` uses the real particle templates for bolt and blast actions, which have no inventory icons.

`unitComparisonStats` creates only equipment records in a minimal ECS and calls `getEntityDisplayStats`, so displayed attributes include equipped bonuses and the same haste/vision offsets as the game. The Damage row uses the NPC caster's balancing overrides, including concealed weapons. Stat pickup entries require a production recipe, trade or unit reference; command-only aliases remain available in the command wiki.

Enemy overview groups distinguish Ilex and Oak Adds from ordinary roaming enemies. Hedge entries stay in the detailed comparisons but are omitted from that overview. Golem Limb is the right-hand column of the Golem comparison. Sign remains under Units. Torch and Boots are separate accessory comparisons so every reachable upgrade stays visible.

`getWikiUnitSprite` uses complete native unit portraits and the existing Rotten Tree stump for its otherwise invisible root entity. Non-default quest chests appear as reward frames outside the default chest comparison. Spawned remains belong inside each unit's Drops frame.

`getWikiUnitName` uses full unit keys for NPC names and full comparison headings, while ordinary mentions keep native creature names. Animals with a sprite but no printed native name fall back to the unit name.

`unitRewardChests` groups native vanish chests and sequence rewards under their encounter: Ilex, Oak, Worm and Nomad. Item acquisition links point to the encounter; its Drops cell shows the native contents in a Chest frame. Tumbleweed has its own name and belongs to Desert plants.
