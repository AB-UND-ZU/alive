# LEVEL

Stores the active level’s dimensions, cell matrices, spatial map, and generation data.

`Level`

| Field | Type |
| --- | --- |
| `name` | `LevelName` |
| `map` | `Record<number, Record<number, Record<string, Entity>>>` |
| `walkable` | `Matrix<0 \| 1>` |
| `biomes` | `Matrix<BiomeName>` |
| `cells` | `Matrix<CellType>` |
| `objects` | `Matrix<CellType[] \| undefined>` |
| `cellPositions` | `Record<string, Position[]>` |
| `size` | `number` |
| `initialized` | `Matrix<boolean>` |

Attach with `world.addComponentToEntity(entity, LEVEL, data)`. Query with `world.getEntities([LEVEL])`.

Systems: `ai`, `ballistics`, `consume`, `damage`, `drop`, `fishing`, `freeze`, `harvest`, `homing`, `immersion`, `initialize`, `interact`, `leveling`, `magic`, `map`, `movement`, `needle`, `popup`, `renderer`, `text`, `trigger`, `vessel`, `visibility`, `water`.
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
