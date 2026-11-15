# Level

Stores the active level’s dimensions, cell matrices, spatial map, and generation data.

[Initialize](../systems/initialize.md) creates cells lazily. [Map](../systems/map.md) maintains spatial registration and walkability.

| Field         | Meaning                                               |
| ------------- | ----------------------------------------------------- |
| `size`        | Width and height of the square wrapping level.        |
| `cells`       | Cell kinds in a column-first [x][y] matrix.           |
| `objects`     | Object kinds stored at each [x][y] cell.              |
| `initialized` | Whether the entities for each cell have been created. |
| `map`         | Registered entities grouped by x, y and entity ID.    |

`serverPlayers` is a derived public roster of account IDs, names, connection/ban status and admin flags. It supplies username completion across levels; host saves omit it. Reconnect secrets never enter the ECS.
<!-- source-types -->

## LevelName

```ts src/engine/components/level.ts
export type LevelName = "LEVEL_MENU" | "LEVEL_TUTORIAL" | "LEVEL_ISLAND";
```

## BiomeName

```ts src/engine/components/level.ts
export type BiomeName = "jungle" | "desert" | "ocean" | "glacier";
```

## Level

```ts src/engine/components/level.ts
export type Level = {
  name: LevelName;
  serverPlayers?: {
    id: string;
    username?: string;
    status: "online" | "offline" | "banned";
    admin: boolean;
  }[];
  cooperativeRewards?: Omit<Item, "carrier" | "bound">[][];
  cooperativeDefeated?: Partial<Record<UnitKey, number>>;
  // map[x][y][entityId] = entity
  map: Record<number, Record<number, Record<string, Entity>>>;
  walkable: Matrix<0 | 1>;
  biomes: Matrix<BiomeName>;
  cells: Matrix<CellType>;
  objects: Matrix<CellType[] | undefined>;
  cellPositions: Record<string, Position[]>;
  size: number;
  initialized: Matrix<boolean>;
};
```
