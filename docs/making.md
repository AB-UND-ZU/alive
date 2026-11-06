# Making things

Workstations turn gathered items into supplies and equipment. Stand close, open the interaction, and check the required ingredients before confirming. Shops show both price and stock; owning part of a recipe is not enough to redeem it.

## Crafting

A workbench combines basic materials. Current recipes include sticks from leaves, wood from sticks, iron from ore, and arrows from sticks and ore.

```scene
crafting
```

The example imports all workbench recipes. Ten sticks make one wood. Ten ore make one iron. One stick and one ore make an arrow. These recipes have no added coin fee.

## Brewing

A kettle prepares food, potions, and other supplies. Some recipes offer several ingredient choices for the same result. Brewing takes time after the ingredients are committed.

```scene
brewing
```

Each listed ingredient option is an alternative. You need all parts of one option. For example, a wood health potion batch can use an apple, wood, and ore, or one of the recipe's other listed options.

## Forging

An anvil upgrades supported equipment. Select an item and an available material or element option. The forge checks the carried item, required ingredients, and supported upgrade. Forging has a timed hit interaction; follow the indicator rather than repeatedly confirming without looking.

Swords, shields, several spells and skills, tools, and accessories have different upgrade rules. A material existing in the game does not make it a valid upgrade for every slot. Check the result shown in the forge.

```scene
forging
```

This reference shows supported upgrades for a few starting items. The anvil still checks your inventory and the forging interaction.

## Building

A hammer opens construction choices. Select a plan, then place it on suitable ground. The hammer's build stat must meet the plan level, and the inventory must contain the parts. Some plans have directional variants.

```scene
building
```

Fences use sticks. Paths use gravel. Boats need water. Jetties require a higher hammer level than the basic plans. Some ground plans complete immediately; other structures need work after placement.

The example reads all construction plans, their allowed ground, ingredients, and work. It does not place a structure or spend resources.

## Trading

Characters can offer buy and sell tabs. Select a deal, check its requirements, and confirm. Some have limited stock. Quest interactions and services differ between characters, so read the active tab and prompt.

Do not use the design PDF's price tables as a shopping list for the current game. Recipes and prices have changed; the in-game deal and the examples here read current data.
