# Island Paths

Checks generated Islands with the native pathfinder. `getPlayableMatrix` samples real cell factories to determine blocked terrain without initializing every world cell. Doors count as passable because their keys are available; movable units do not permanently block a route. Water follows the native submerged-cell rule.

`toMatrix` shifts world positions by half the level size so the Island is centered in the doubled path matrix. Generation tests and the documentation's exploration snapshot reuse these helpers.
