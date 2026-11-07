# wfc.ts
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
