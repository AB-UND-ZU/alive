# Three.js renderer

Draws the world with instanced stacked glyphs, animated transforms, circular light and shadows. It uses the shared fixed-step clock, viewport collector and sprite segments. Fog visibility comes from engine components.

The browser terminal supplies world and cell dimensions. The renderer preserves the shared React world callbacks for loading, saving and controls, and mounts its scene in a Three.js canvas.

Representation tests live in this directory. Game rules and timing tests use the testing renderer without mounting a canvas.
