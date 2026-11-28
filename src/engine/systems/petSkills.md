# Pet Skills

Records the opponent for a pet helping its owner, applies kill rewards, and handles gathering, harvesting and delivery.
<!-- source-types -->

## Pet

```ts src/engine/systems/petSkills.ts
type Pet = TypedEntity<"TAMEABLE" | "POSITION" | "INVENTORY" | "STATS">;
```
