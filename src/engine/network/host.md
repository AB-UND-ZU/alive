# Authoritative host

`createHost` constructs the native menu world or restores a server-owned snapshot and installs the authoritative systems. `step` advances a fixed 30 Hz simulation, retaining the slower world reference and each actor's own reference phase. Transport handlers only place validated intent into actor mailboxes. They cannot provide positions, clock deltas, inventory or character IDs.

Authenticated account IDs bind to the optional `PLAYER.accountId` component field. Existing actors reconnect by account ID. Death and respawn carry ownership to the replacement ghost and hero. The saved world includes both the snapshot and elapsed simulation time; reconnect credentials remain separate in server persistence.

This is engine/transport integration, not a finished multiplayer game flow. Menu character selection, per-player interaction prompts and shared dialog entities, transfers between menu/game realms, co-op quest rewards and late joins after level advancement are still unfinished. In particular, the single-player warp currently destroys other actors; it must not be exposed as a playable multiplayer transition before realm transfer is implemented.
