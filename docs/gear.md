# Gear and life

Health keeps you alive. Mana pays for spells. Experience raises your level. Equipment and food help you recover and reach harder parts of the world.

## Classes and stats

Rogue is available in normal class selection. Knight, Mage, Scout, and the unknown class have definitions in the code; they are shown here as a reference, not as unlocked choices.

```scene
classes
```

Rogue begins with 25 maximum health, 10 maximum mana, 1 power, and 1 haste. Equipment can change the final stats. Rogue, Knight, and Mage have progression tables up to level 10; the other two definitions do not use that progression.

Leveling requires the current experience target. The level-up sequence awards maximum health and mana according to the class. Current values, maximum values, and caps are separate: raising a maximum does not remove its class cap.

## Equipment

Gear includes weapons, shields, spells, skills, tools, and accessories. Open G to inspect equipment. The bag and gear menus let you inspect and select items. Use the item's displayed name and stats to compare it.

Materials include wood, iron, gold, diamond, and ruby. Elements include fire, water, earth, and air. Not every combination is offered by a shop or forge. The [making guide](making.md) explains the workstations.

## Food and usable items

Use E on a selected usable item. Apples restore health; mushrooms restore mana. Other food can restore different amounts or a percentage of a maximum. Some usable items grant experience. Thorns hurt when used.

```scene
food
```

The reference reads the current consumption table. A percentage is a share of the maximum stat, not a fixed number of points.

## Potions

Potions in the inventory are consumed automatically when a stat is low enough. They leave a small gap below the maximum so loose health or mana drops can still help. Each potion has a cooldown and a limited supply of doses.

Wood health potions restore 2 health per dose; iron restores 5 and gold restores 8. The mana equivalents restore 1, 2, and 3. Drinking is delayed by the consumption sequence; carrying a potion is not instant protection against a lethal hit.

## Death and return

At zero health, the hero dies and a grave marks the location. The game drops unbound belongings into nearby available cells. Bound items follow their own rules.

The respawn sequence returns a new hero to a spawn point. A quest marker points toward the grave so you can recover what was dropped. Recovering items does not restore the old session's current mana or experience automatically.

Deaths are counted for the whole game and shown with your [saved games](controls.md#save-and-continue).
