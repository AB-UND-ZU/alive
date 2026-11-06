# Combat

Walk toward an attackable target to strike with an equipped sword. Movement, attacks, and other actions share the unit's action timing. Watch an enemy's direction and warning before moving close.

## Physical and magic damage

Power adds to physical attacks. Wisdom adds to magic attacks. Armor reduces physical damage; resist reduces magic damage. Equipment adds its own stats.

A weak hit can still deal a fraction of a health point. The display shows whole-point changes when enough damage has accumulated. A shield does not make every weak attack harmless. Spikes deal true damage when touched or attacked.

## Spells

Space activates the equipped spell when you can cast it. Spells use mana. Their shapes, range, and effects depend on the spell and its material or element.

| Spell | Shape or use                             |
| ----- | ---------------------------------------- |
| Wave  | Expanding wave around the caster         |
| Beam  | A line of magic that can leave a trail   |
| Trap  | A placed effect that threatens its cells |
| Dash  | Movement with a spell effect             |
| Bolt  | Directed projectile                      |
| Blast | Burst effect                             |

```scene
abilities
```

This reference reads spell values from the game. It shows base wood spells without an element, before the caster's bonuses. It is a data viewer, not a combat arena. Availability depends on the items you find.

## Skills

Shift activates a skill or the selected tool. Skills include bow, spear, wand, slash, zap, block, and totem. Some use ammunition; rechargeable skills use charges. The action bar shows the required supply.

A bow uses arrows. Slash works with the sword. Q switches between a tool and a skill when both are equipped. Keep an eye on the current button label before pressing Shift.

## Elements

Fire can burn units and plants and thaw ice. Burning continues to hurt until it ends or is extinguished. Water can freeze units and water cells. Earth effects can drain or restore health, depending on the ability. Air modifies abilities as defined by their equipment.

Effects do not all work on every target. Friendly relationships, immunity, terrain, and the spell's own hit tracking affect the result. One cast can affect several targets without repeatedly applying the same hit to each one.

## Enemies

Prisms move in straight lines and turn at obstacles. Eyes wake when a target gets close and approach it. Orbs align ranged attacks and retreat. Fairies try to stay away. Other creatures and encounters have their own patterns.

Keep space to dodge, avoid standing in a firing line, and use terrain to break an approach. Better materials can make the same creature more dangerous.
