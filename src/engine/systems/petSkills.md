# Pet Skills

Records the opponent for a pet helping its owner, applies kill rewards, and handles gathering, harvesting and delivery. Any living pet can return a stick. An owner’s throw starts a short run, or two laps if the companion asked to play. Returning a requested stick awards 1 XP and shows the same heart as feeding.
<!-- source-types -->

## Pet

```ts src/engine/systems/petSkills.ts
type Pet = TypedEntity<"TAMEABLE" | "POSITION" | "INVENTORY" | "STATS">;
```
