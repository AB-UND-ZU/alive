# Spells

```widget
popup equip:spell
```

[[key:Space]] Cast the equipped spell.

Each cast requires mana.

[Elements](elements.md) change spell and equipment effects.

A cast can hit several targets. [[item:beam]] can hit the same target repeatedly while it lasts. Friendly relationships and immunity can prevent an effect.

[[item:trap]] briefly shows a warning above its cast cell, then arms after its caster leaves the cell. An enemy anywhere in the [[data:3x3]] area triggers the warning. Your trap flashes for [[data:0.5 s]]. A [[unit:banditMage]] trap flashes for [[data:1 s]]. Both stay active for [[data:0.5 s]] and hit each target once, including anyone who enters during that time.

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
