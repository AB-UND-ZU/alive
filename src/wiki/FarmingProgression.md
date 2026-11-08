# Crop Growth

The specimen creates native dry Soil, gives the hero a filled Water Bucket and Grain, then runs the harvest system to water it. `plantSeed` spends the Grain and creates its first sapling. Advancing to the system's own `nextGeneration` values records each growth stage and the dropped Wheat. No growth durations or sapling sprites are copied into the renderer.

`worldRows` captures each stage with the hero outside the cell. The table keeps those normal-size native layers on matching coordinates.
