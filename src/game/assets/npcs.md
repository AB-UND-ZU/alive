# NPC Sequences

Defines staged NPC and encounter behavior. Each exported function is a Sequence callback: it receives the world, owning entity and persistent NpcSequence state, then reports whether it updated or finished.

| Sequence            | Area or owner                         |
| ------------------- | ------------------------------------- |
| menuNpc             | Menu portals and introductory state   |
| tutorialNpc         | Tutorial progression                  |
| earthTownNpc        | Earth Town population                 |
| earthChiefNpc       | Earth chief dialog and quest stages   |
| earthDruidNpc       | Earth druid stages                    |
| earthSmithNpc       | Earth smith stages                    |
| fireHavenNpc        | Fire Haven population                 |
| fireChiefNpc        | Fire chief stages                     |
| fireGateGuardNpc    | Haven gate guard                      |
| fireSmithNpc        | Fire smith stages                     |
| fireDruidNpc        | Fire druid stages                     |
| fireNomadNpc        | Nomad's travel and house state        |
| worldNpc            | World encounter, gate and focus state |
| tombstoneNpc        | Tombstone interaction                 |
| oakRoom             | Oak room encounter                    |
| chestNpc            | Chest boss encounter                  |
| oscillatingStormNpc | Repeated storm effects                |
| wanderingTornadoNpc | Moving tornado effects                |

Start them with `npcSequence` from [sequence helpers](utils.md). The shared `step` helper runs entry work once and advances when the step condition completes. Store progress in `state.args.memory` so it remains part of [saved snapshots](../../engine/snapshot.md).
<!-- source-types -->

## ContactCircle

```ts src/game/assets/npcs.ts
type ContactCircle = {
  generation: number;
  rendered: number;
  position: Position;
  color: string;
};
```
