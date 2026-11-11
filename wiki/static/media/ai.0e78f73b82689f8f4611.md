# AI

Runs the queued patterns in [Behaviour](../components/behaviour.md) when the world generation changes. Dead, frozen or patternless units do not act.

| Pattern work          | State                                      |
| --------------------- | ------------------------------------------ |
| Movement and attacks  | Directional input and action targets       |
| NPC stages            | Pattern memory, dialogs and sequence steps |
| Spawners and habitats | Created units and remaining population     |
| Boss patterns         | Phase memory, limbs and effects            |

Patterns keep their own memory and may add or remove patterns. [Movement](movement.md) and [Trigger](trigger.md) consume the resulting intent later in the update. NPC story stages are defined in [NPC sequences](../../game/assets/npcs.md).

The worm tracks planned length separately from the number of parts that have emerged on this flight. An underground tail loss decays at the exit hole without removing the exposed neck; an emerged tail detaches normally. Growth continues until the complete surviving body has emerged, even after the head enters the destination hole. This avoids stopping growth on damage and avoids refilling previously emerged parts when visible parts disappear underground. Summon destinations reserve free cells on the radius-five tower ring until arrival. Rage summons pass from neck through mouth and use its upper half. Towers trace both directions along one fixed cardinal axis, with a center waypoint on inward shots to avoid toroidal path reversal.

Regular worm jumps choose dry start and end cells, excluding the jetty. The opening flight starts at the exposed lake head only after its wave has ended. Underground phases remove attack, effect and contact components; surfacing restores them. Death preserves the rendered mouth as visual fragments for the shared colored vanish sequence, without extending the living hitbox.

The first wave clears walls and lights individual fire-rim cells as its diamond front comes within one cell, rather than clearing a circular area ahead of the animation. The worm uses the existing enemy shout dialog once each for its intro, first rage entry, and death. Intro and rage wait until the head is still to shout, then wait for the dialog sequence to finish before attacking. Artillery retains its warning and flight timings but repeats every seven ticks.

All worm emergence uses the same shadow, head, rise and neck steps. Lake emergence is one cell south of center, leaving the head at center once exposed and the neck south of it. Independent ground holes stay fixed and expire three ticks after closing. Flight attacks cycle through spaced pairs, roof pairs, and an outer shield with four fewer discs than planned segments, compensating for the extra distance around two corners. Its first disc begins at the moving neck; excess trailing discs retire if the body shortens, keeping the final landing aligned with the tail.

Rage stays latched after 25% HP, chooses one of the other two attacks each time, and casts a wave, four gold blasts centered on the mouth, or exactly three red knockback slashes. It returns to selection as the wave finishes. Its monotonic three-percent threshold counter preserves queued summons across healing.

Towers use one queued action. Shot bursts finish all three opposing pairs, then pause eight ticks. When choosing a new action, a nearby hero and at least two shots since the last slash queue a four-tick iron melee slash and reset the counter; otherwise the next shot is queued and counted. Slashes deal one melee damage, knock three, and do not burn. Artillery launches two single-hit fire orbits once on entering the phase, via the existing homing orbit support, and permits adjacent-player slashes without firing new bursts. Leaving the phase retires both through homing decay. Rage cancels queued attacks and permits only healing at or below 25% health; towers wait if the boss heals above that cap. Projectiles retire before disposal so later movement cannot re-register them in the map.

Artillery markers blink every half world tick in the existing room sequence. Its wave range is two, with explicit bounds matching the visible reach. Artillery skips tower cells at targeting and impact; towers ignore environmental fire and fire spells.
Worm room cleanup removes placed arena entities, using both identifiers and positions. Loot items can inherit the `worm:` prefix, so matching that prefix alone would delete items still owned by drop containers or the hero.
