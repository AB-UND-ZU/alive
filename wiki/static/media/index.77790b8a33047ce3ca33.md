# Terminal

Frames the selected browser renderer with the same DOM controls and pause overlay. Three.js is the default; `?renderer=html` uses the HTML renderer. Both consume the renderer interface and the current world.

Children appear above the scene, before the pause overlay. Feature previews use that slot for their character-cell frame. `shadows={false}` disables Three.js lighting and shadows while retaining engine fog of war.
