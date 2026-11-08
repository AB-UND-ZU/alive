# WFC

Generates weighted tile layouts by collapsing choices and propagating tag constraints to neighboring cells. Town and haven generation use this solver; it does not generate the Island terrain noise.

| Wave method             | Contract                                                 |
| ----------------------- | -------------------------------------------------------- |
| constructor             | Allocate weighted options and an empty chosen matrix     |
| reset                   | Restore all candidate options and remaining count        |
| getOptions              | Candidate weights for an uncollapsed cell                |
| getChosen               | Chosen tile index                                        |
| getStates               | Options, or the chosen state with infinite weight        |
| getAdjacentCells        | Cardinal neighbors within the layout bounds              |
| collapse                | Choose a weighted option, or force one tile index        |
| ban                     | Remove one option; throw when none remain                |
| getLowestEntropyCell    | Choose the next unresolved cell, with tie-breaking noise |
| calculateShannonEntropy | Entropy of positive candidate weights                    |
| isCompleted             | Whether no cells remain unresolved                       |
| contains                | Whether a coordinate is inside the layout                |

| WaveFunctionCollapse method | Contract                                                     |
| --------------------------- | ------------------------------------------------------------ |
| constructor                 | Compile tile weights, tag indices and constraints            |
| getTilesFromOptions         | Resolve weighted option keys to tiles and indices            |
| getTileFromIndex            | Resolve one chosen index to its tile definition              |
| getTileConstraints          | Compiled constraints for a tile index                        |
| tileIntersectsTags          | Whether a tile has one of the supplied tags                  |
| propagate                   | Ban incompatible options and propagate resulting changes     |
| iterate                     | Collapse one lowest-entropy cell and propagate               |
| generate                    | Apply forced tiles and constraints, then collapse the layout |

`generate(width, height, forced)` retries contradictions up to five times and returns undefined if none succeeds. Forced entries are `[x, y, tileName]`. Adjacency stops at the layout edges rather than wrapping.

```ts src/engine/wfc/wfc.ts
const generator = new WaveFunctionCollapse({
  tags: { ground: {} },
  tiles: { grass: { tags: ["ground"] } },
});
const wave = generator.generate(8, 8);
if (!wave) throw new Error("No valid layout");
const tile = generator.getTileFromIndex(wave.getChosen(0, 0));
```

Tile weights default to 1. A tile can inherit constraints from its tags as well as its own definition. [World creation](../../bindings/creation.md) inserts the resulting cells into the level.
<!-- source-types -->

## Constraints

```ts src/engine/wfc/wfc.ts
export type Constraints = {
  neighbour?: {
    up?: string[];
    right?: string[];
    down?: string[];
    left?: string[];
  };
};
```

## Tag

```ts src/engine/wfc/wfc.ts
export type Tag = {
  constraints?: Constraints;
};
```

## Tile

```ts src/engine/wfc/wfc.ts
export type Tile = {
  tags: string[];
  weight?: number;
  constraints?: Constraints;
};
```

## Definition

```ts src/engine/wfc/wfc.ts
export type Definition = {
  tags: Record<string, Tag>;
  tiles: Record<string, Tile>;
};
```

## MappedConstraint

```ts src/engine/wfc/wfc.ts
type MappedConstraint<K extends keyof Constraints> = {
  constraint: Partial<NonNullable<Constraints[K]>>;
} & (
  | {
      tag: string;
      tileIndex?: never;
    }
  | {
      tag?: never;
      tileIndex: number;
    }
);
```

## MappedConstraints

```ts src/engine/wfc/wfc.ts
type MappedConstraints = Required<{
  [K in keyof Constraints]: MappedConstraint<K>[];
}>;
```
