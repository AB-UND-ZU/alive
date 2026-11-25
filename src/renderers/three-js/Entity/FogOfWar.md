# Fog Of War

Renders a black quarter-shade over explored terrain. Snow cover uses a grey quarter-shade just above the underlying terrain’s fog so its dots remain visible. Both masks are unlit. `Entity` decides when the overlay is needed from visibility and loot state; this component only draws it.
