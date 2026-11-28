# Pet AI

Chooses a pet’s next move on its movement clock. Sleep recovery uses the world clock. Pets avoid fire, dodge hostile spells and seek fountains when hurt. A halo follows one cell farther away.
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
  hp?: number;
  fleeUntil?: number;
  heal?: number;
  landing?: boolean;
  door?: Position;
  structure?: number;
  position?: Position;
  neighbors?: string;
  idle?: number;
  sleeping?: number;
  nextRecovery?: number;
  circle?: number;
  refuseUntil?: number;
  playSince?: number;
  nextSpeech?: number;
  requested?: number;
  walkSpots?: Position[];
  nextWalk?: number;
};
```
