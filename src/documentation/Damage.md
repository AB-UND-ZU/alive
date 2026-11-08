# Damage Calculator

The calculator calls `calculateDamage` with editable attacker and defender stats. It keeps fractional HP between hits. Changing attack type uses the corresponding iron sword or wand damage; True retains the editable base amount.

Portraits compose the actual class backdrop, body and equipment in game layer order. Each fighter owns its related inputs and results. Native minus/plus buttons adjust the outlined numeric fields; damage types use dialog tabs. Each stat label uses its real icon and color.
<!-- source-types -->

## DamageKind

```ts src/documentation/Damage.tsx
type DamageKind = "melee" | "magic" | "true";
```
