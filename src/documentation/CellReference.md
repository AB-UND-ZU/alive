# Cell References

Harvest targets use the units whose native `harvestable` resource matches the row, including every matching variant. Planting results use the resulting cell or unit, rather than its implementation key. Item pickups keep the existing item references.

Other cells use `cellSnapshot` from World Plants, so their icons come from the real cell factory, including layered flora and remains. Construction plots use the same `plot` sprite as [performPlot](../engine/systems/trigger.md), since they are not a cell-factory kind. Readable labels identify those cells; links point to the corresponding feature or plant family. Sprite mentions retain dialog gray, with the shared reference hover and underline behavior.
