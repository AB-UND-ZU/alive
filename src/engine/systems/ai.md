# AI

Runs the queued patterns in [Behaviour](../components/behaviour.md) when the world generation changes. Dead, frozen or patternless units do not act.

| Pattern work          | State                                      |
| --------------------- | ------------------------------------------ |
| Movement and attacks  | Directional input and action targets       |
| NPC stages            | Pattern memory, dialogs and sequence steps |
| Spawners and habitats | Created units and remaining population     |
| Boss patterns         | Phase memory, limbs and effects            |

Patterns keep their own memory and may add or remove patterns. [Movement](movement.md) and [Trigger](trigger.md) consume the resulting intent later in the update. NPC story stages are defined in [NPC sequences](../../game/assets/npcs.md).
