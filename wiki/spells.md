# Spells

```widget
popup equip:spell
```

[[key:Space]] Cast the equipped spell.

Each cast requires mana.

[Elements](elements.md) change spell and equipment effects.

A cast can hit several targets. [[item:beam]] can hit the same target repeatedly while it lasts. Friendly relationships and immunity can prevent an effect.

[[item:trap]] arms after you leave its cell. Enemies anywhere in its [[data:3x3]] area trigger a blinking [[data:0.5 s]] warning, followed by a [[data:0.5 s]] blast. Each enemy is hit once, including enemies that enter after activation.

With [[item:earth]], an injured ally triggers it only from the center. The active area heals allies once while damaging enemies.

```widget
items spells
```

## Direct Casts

`bolt` and `blast` are effects used by `/cast`, not equippable spell items.

```text
/cast bolt iron fire
/cast blast iron water
```

```scene
abilities
```
