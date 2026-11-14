# Authoritative host

`createHost` constructs the native menu world or restores a server-owned snapshot and installs the authoritative systems. `step` advances a fixed 30 Hz simulation, retaining the slower world reference and each actor's own reference phase. Transport handlers only place validated intent into actor mailboxes. They cannot provide positions, clock deltas, inventory or character IDs.

Authenticated account IDs bind to the optional `PLAYER.accountId` component field. Existing actors reconnect by account ID. Death and respawn carry ownership to the replacement ghost and hero. The saved host includes each level world’s snapshot and spawn template, plus elapsed simulation time; reconnect credentials remain separate in server persistence.

Hosted portal transitions enqueue a transfer at the simulation boundary. Menu, dungeon and island have independent worlds; another character may remain in a previous level. Native single-player warps retain their existing behavior. A transfer creates a native hero at the destination spawn, carries persistent player data and inventory, remaps equipment to the new item IDs and primes applied equipment bonuses. Conditions, open interfaces and temporary sequences do not carry across levels. Source cleanup completes before ownership resolves to the new actor. Each actor gets new private interfaces in the destination world.

Terrain initializes around every hosted player, rather than one global camera. Fog remains cooperative. Snapshots are selected by the authenticated account’s current world, and a client discards old entity identities when changing realms. The same numeric ID may refer to different entities in different worlds.

The transport and engine support realm transfers, and browser connection flow work together; cooperative quest rewards and the script targeting audit are still unfinished. Reconnecting resumes the character in its own saved world; game progression remains shared within that world.

A hosted `PLAYER.connected` flag distinguishes saved characters from active participants. Disconnecting releases their NPC dialog, removes them from targeting and passability checks and hides their actor in other client views. Characters remain in the authoritative save at their last position. Damage over time is ignored while disconnected without accumulating a burst for reconnect, and passive potions are not consumed. Restarted hosts mark all saved characters offline until authenticated. Pausing stops only input and leaves the character in play.
