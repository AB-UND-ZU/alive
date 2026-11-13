# Box

Renders shared box geometry in cell coordinates. `height` controls its vertical thickness and `offset` its elevation. An optional orientation selects a directional half-cell shape.

Geometry comes from `getBoxGeometry`; materials are supplied as children. Reusing the geometry avoids allocating a new GPU buffer for every mounted box.
