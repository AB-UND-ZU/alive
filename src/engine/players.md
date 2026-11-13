# Player selection

`getLocalPlayer` selects the entity assigned to a client view through `world.metadata.localPlayerId`. With no assignment it retains the existing single-player first-player behavior. With an assignment, a missing entity produces no player; controls must never take over another actor during reconnects or transitions. This metadata is view-local and is not saved in world snapshots.

`useHero` and the Systems render fallback honor this assignment. Camera ownership, shared dialog entities and the global interaction prompt still require per-player isolation before multiplayer UI is complete.

`getClosestPlayer` chooses the nearest living non-ghost player satisfying the requested components, using the current map's wrapping distance. Equal-distance ties retain entity order. AI behavior patterns use this selector instead of the global `hero` identifier. Scripted quests and boss room sequences still need a separate multiplayer audit; changing target selection alone does not make quest rewards cooperative.
