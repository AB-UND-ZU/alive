# Spike

Applies contact damage when a controllable, non-flying unit attempts to enter a spiked target.

The actor is checked once per action generation and cannot have interacted already. `getSpikable` reads the target's current combined `spike` stat; legacy [Spikable](../components/spikable.md) data does not supply it. Damage uses the shared [combat calculation](damage.md), and an active bubble can absorb the hit.

Runs before melee and [Movement](movement.md), so contact can consume the attempted move.
