# Gathering

Tools let you change the ground and collect materials. Activate a tool, then give a direction toward the target. A tool needs the right kind of target and enough work to finish it.

## Chopping, mining, and digging

| Tool    | Typical targets                         |
| ------- | --------------------------------------- |
| Axe     | Trees, hedges, palms, wooden objects    |
| Pickaxe | Mountains, mines, stone barriers        |
| Shovel  | Crops, roots, sand, paths, loose ground |
| Hook    | Fishing and hooking targets             |
| Hammer  | Construction                            |

```scene
harvesting
```

Trees yield sticks. Oaks yield wood and a sapling. Mountains yield ore; iron and gold deposits yield their material. Digging sand gives sand, while paths give gravel. The reference shows work requirements and drops from the current harvesting table.

A higher tool stat can change how quickly work finishes. Some scenery can also be burned or broken, but destroying it that way need not give the same harvest.

## Planting

Seeds and other plantable items need watered soil. The planting interaction selects what to plant. Crops then grow over game ticks. Some yield a crop; others grow into terrain such as a hedge, tree, or cactus.

```scene
farming
```

Berries grow fruit, flowers grow herbs, and grain grows wheat. Leaves grow hedges. Saplings grow apple trees. Keep water close to soil or use a filled bucket. Harvest the result with the appropriate tool.

The example includes the growth duration multiplier. Growth stages vary in length, and snow can delay them. These are approximate world ticks, not a wall-clock countdown.

## Fishing

Equip a hook and carry worms. Activate the hook and choose a direction to cast. Watch for a catch, then use the action when the game calls for it. Hooks can interact with other hookable targets as well.

```scene
fishing
```

The reference shows the catch distribution for the three configured fishing levels. Higher levels change which fish are likely. These percentages apply to the catch table; they are not the chance that any cast will succeed.

Fish have different uses. Salmon and tuna restore health; pike and cod restore mana. Algae and eel give experience. Pearls and other catches may be useful for trade or recipes.

## Boats and building

Boats let you cross water beyond the wading limit. A hammer can build a boat on water if you have the parts and the required construction level. Jetties, paths, fences, and workstations are also construction plans. See [making things](making.md).
