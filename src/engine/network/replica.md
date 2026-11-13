# Authoritative client replica

`createReplica` creates a world without gameplay systems. Its `receive` method accepts increasing snapshot sequence numbers and nondecreasing server timestamps, then applies confirmed state in place through `restoreSnapshot`. It preserves entity identity, view-local ownership and render listeners, and removes entities and components absent from the new state.

The replica does not execute movement, spells, damage or AI. It does not replay missed snapshots or predict outcomes during a stall. The current primitive applies discrete confirmed states; a transport, interpolation clock and cosmetic animation bridge are still needed before it is a playable network client.

The tests verify stable actor references, component and entity removal, stale-state rejection and that attempted local movement and spell activation cannot run gameplay systems or alter the server world.
