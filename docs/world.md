# World

The route begins in the menu area, continues through the Dungeon, and leads to the Island. Signs and characters introduce the next task.

## Dungeon

The Dungeon is a fixed set of connected rooms. It teaches movement, keys and doors, collecting, fighting, trading, and other interactions. Read the signs before leaving a room. Some rooms stay covered until their entry opens.

Keys have materials. A locked entry needs the matching key; opening it consumes that key. Follow the quest marker when the next step is unclear.

## Island

The Island is generated for each session. Its terrain combines forests, mountains, sand, water, paths, and settlements. Town layouts use constrained tile generation. Paths connect places worth visiting.

Explore away from the settlement for resources, enemies, and encounters. A layout or creature existing in the game data does not guarantee it appears at every nearby location.

## Fog and light

Unexplored cells are covered. Nearby cells become visible when they are within your vision and not blocked by terrain. Previously seen ground can remain dimly visible after you leave; moving creatures and loose items need current sight.

Vision and light help you see farther. Mountains obstruct sight. A building changes what is visible when you step inside.

## Water and ice

You can wade near land. Deep water farther from shore blocks ordinary walking. Boats provide another way across. Water slows movement and extinguishes burning units.

```scene
water
```

Walk right into the shallow water. The deeper cells stop the hero. Use up and down to follow the shore.

Water effects can freeze water into ice. Ice causes sliding; fire can thaw it. A frozen unit cannot act normally until the effect ends or is removed.

## Buildings and objects

Doors control entry. Inside a house, the roof disappears and the view shows its interior. Leaving restores the outside view.

Some objects can be destroyed for drops. Crates can be pushed if the cell behind them is free. Pushing two blocked crates as a chain does not clear the way.

```scene
pushing
```

Push the crate right until it reaches the mountain. Move around it to try another side.

## Finding your way

The compass points to its current target. Quest focus marks an objective; after death, a marker helps you find the grave. The map is available through M. These aids point you toward a place, but walls and water can still require a route around them.
