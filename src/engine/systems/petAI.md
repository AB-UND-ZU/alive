# Pet AI

Chooses a pet’s next move on its movement clock. Sleep recovery uses the world clock. The pet waits outside buildings, steps aside when its owner stops on it, and retreats toward its owner when hurt.
<!-- source-types -->

## Pet

```ts src/engine/systems/petAI.ts
type Pet = TypedEntity<
  "BEHAVIOUR" | "TAMEABLE" | "POSITION" | "MOVABLE" | "STATS" | "TOOLTIP" | "INVENTORY"
>;
```

## Memory

```ts src/engine/systems/petAI.ts
type Memory = {
  target?: number;
  attacker?: number;
  fleeUntil?: number;
  heal?: number;
  door?: Position;
  structure?: number;
  position?: Position;
  neighbors?: string;
  idle?: number;
  sleeping?: number;
  nextRecovery?: number;
  circle?: number;
  refuseUntil?: number;
  nextSpeech?: number;
  walkSpots?: Position[];
  nextWalk?: number;
};
```
