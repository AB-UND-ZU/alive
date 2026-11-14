# Test world context

`createWorldContext(world, overrides)` supplies the shared React world context with inactive session callbacks. It has no renderer dependency, so browser UI and hook tests can mount a paused world without loading Three.js. The Three.js testing helpers reexport it for existing scene tests.
