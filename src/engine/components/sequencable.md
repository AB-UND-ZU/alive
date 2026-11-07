# SEQUENCABLE

Stores running animation, quest, and dialog sequences.

`ConsumeSequence`

| Field | Type |
| --- | --- |
| `itemId` | `number` |

`DropSequence`

| Field | Type |
| --- | --- |
| `height` | `number` |
| `fast` | `boolean` |
| `type` | `Exclude<Liquid["type"], "bubble">` |

`WeatherSequence`

| Field | Type |
| --- | --- |
| `position` | `Position` |
| `viewable` | `Position` |
| `start` | `number` |
| `end` | `number` |
| `intensity` | `number` |
| `ratio?` | `number` |
| `generation` | `number` |
| `drops` | `{ position: Position; fast: boolean; timestamp: number; particle: string; }[]` |
| `type` | `Weather` |

`VisionSequence`

| Field | Type |
| --- | --- |
| `light?` | `Light` |
| `previousLight?` | `Light` |
| `fast` | `boolean` |

`PerishSequence`

| Field | Type |
| --- | --- |
| `fast` | `boolean` |

`PointerSequence`

| Field | Type |
| --- | --- |
| `target?` | `number` |
| `lastOrientation?` | `Orientation` |

`MarkerSequence`

| Field | Type |
| --- | --- |
| `amount` | `number` |
| `type` | `MarkerType` |
| `orientation?` | `Orientation` |

`Message`

| Field | Type |
| --- | --- |
| `line` | `Sprite[]` |
| `orientation` | `Orientation` |
| `fast` | `boolean` |
| `delay` | `number` |
| `stack?` | `number` |

`MessageSequence`

| Field | Type |
| --- | --- |
| `messages` | `Message[]` |
| `index` | `number` |
| `lastMessage` | `number` |

`DecaySequence`

| Field | Type |
| --- | --- |
| `fast` | `boolean` |

`EvaporateSequence`

| Field | Type |
| --- | --- |
| `fast` | `boolean` |
| `sprite` | `Sprite` |

`VanishSequence`

| Field | Type |
| --- | --- |
| `type` | `Vanishable["type"]` |
| `generation` | `number` |
| `grow` | `boolean` |
| `limbs?` | `Record< string, { generation: number; delta: Position; evaporated: boolean; decayed: boolean; } >` |
| `remaining` | `number` |

`BurnSequence`

| Field | Type |
| --- | --- |
| `generation` | `number` |
| `castable?` | `number` |
| `exertable?` | `number` |
| `igniter?` | `number` |
| `lastAffected?` | `Castable["affected"][number]` |

`FreezeSequence`

| Field | Type |
| --- | --- |
| `total` | `number` |

`SmokeSequence`

| Field | Type |
| --- | --- |
| `generation` | `number` |
| `extinguish` | `number` |
| `simmer` | `boolean` |

`FlashSequence`

| Field | Type |
| --- | --- |
| `targets` | `Position[]` |

`CollectSequence`

| Field | Type |
| --- | --- |
| `origin` | `Position` |
| `itemId` | `number` |
| `drop` | `boolean` |
| `delay?` | `number` |
| `amount` | `number` |

`UnlockSequence`

| Field | Type |
| --- | --- |
| `origin` | `Position` |
| `item` | `Item` |

`MeleeSequence`

| Field | Type |
| --- | --- |
| `tick` | `number` |
| `facing` | `Orientation` |
| `rotate` | `boolean` |

`ConditionSequence`

| Field | Type |
| --- | --- |
| `modifier` | `number` |
| `material` | `Material` |
| `orientation?` | `Orientation` |

`SpellSequence`

| Field | Type |
| --- | --- |
| `element?` | `Element` |
| `material?` | `Material` |
| `progress` | `number` |
| `memory?` | `any` |
| `duration` | `number` |
| `range` | `number` |
| `areas` | `number[]` |

`ArrowSequence`

| Field | Type |
| --- | --- |
| `origin` | `Position` |
| `range` | `number` |
| `caster` | `number` |

`SlashSequence`

| Field | Type |
| --- | --- |
| `material` | `Material` |
| `element?` | `Element` |
| `castable` | `number` |
| `exertables` | `number[]` |
| `tick` | `number` |

`TornadoSequence`

| Field | Type |
| --- | --- |
| `material?` | `Material` |
| `element?` | `Element` |
| `amount` | `number` |
| `radius` | `number` |
| `position` | `Position` |
| `exertables` | `number[]` |
| `generation` | `number` |
| `last?` | `number` |
| `gusts` | `{ index: number; radius: number; generation: number; orientation: Orientation; }[]` |

`BranchSequence`

| Field | Type |
| --- | --- |
| `threshold` | `number` |
| `limbs` | `number[]` |
| `grow` | `boolean` |
| `shrink?` | `number` |

`LimbSequence`

| Field | Type |
| --- | --- |
| `type?` | `"wormMouth" \| "golemFist"` |
| `orientation?` | `Orientation` |
| `position` | `Position` |
| `areas` | `number[]` |

`NpcSequence`

| Field | Type |
| --- | --- |
| `step` | `string` |
| `lastStep?` | `string` |
| `memory` | `any` |

`QuestSequence`

| Field | Type |
| --- | --- |
| `step` | `string` |
| `lastStep?` | `string` |
| `memory` | `any` |
| `giver?` | `number` |

`InteractSequence`

| Field | Type |
| --- | --- |
| `active` | `boolean` |
| `orientation` | `Orientation` |
| `generation` | `number` |
| `text` | `string` |
| `sprite` | `Sprite` |
| `offset` | `Position` |

`DiscoverySequence`

| Field | Type |
| --- | --- |
| `idle` | `Sprite` |
| `timestamp` | `number` |
| `hidden` | `boolean` |
| `force?` | `boolean` |

`DialogSequence`

| Field | Type |
| --- | --- |
| `orientation?` | `Orientation` |
| `text` | `Sprite[]` |
| `active` | `boolean` |
| `timestamp` | `number` |
| `lengthOffset` | `number` |
| `isDialog` | `boolean` |
| `isIdle` | `boolean` |
| `isEnemy` | `boolean` |
| `overridden` | `boolean` |

`XpSequence`

| Field | Type |
| --- | --- |
| `generation` | `number` |

`VortexSequence`

| Field | Type |
| --- | --- |
| `generation` | `number` |

`FountainSequence`

| Field | Type |
| --- | --- |
| `generation` | `number` |
| `entered?` | `number` |
| `healed?` | `number` |

`ProgressSequence`

| Field | Type |
| --- | --- |
| `level` | `number` |
| `note` | `number` |
| `ring` | `number` |
| `xp` | `number` |
| `maxXp` | `number` |
| `maxMp` | `number` |
| `maxHp` | `number` |

`PopupSequence`

| Field | Type |
| --- | --- |
| `windowHeight` | `number` |
| `contentIndex` | `number` |
| `contentHeight` | `number` |
| `contentClickable` | `boolean` |
| `detailsPadding` | `number` |
| `generation?` | `number` |
| `scrollIndex?` | `number` |
| `verticalIndex` | `number` |
| `horizontalIndex` | `number` |
| `transaction` | `Popup["tabs"][number]` |
| `instant` | `boolean` |

`SequenceState`

| Field | Type |
| --- | --- |
| `name` | `keyof typeof sequences` |
| `reference` | `number` |
| `elapsed` | `number` |
| `args` | `A` |
| `particles` | `Record<string, number>` |

`Sequencable`

| Field | Type |
| --- | --- |
| `states` | `{ consume?: SequenceState<ConsumeSequence>; spell?: SequenceState<SpellSequence>; aura?: SequenceState<AuraSequence>; drop?: SequenceState<DropSequence>; weather?: SequenceState<WeatherSequence>; vision?: SequenceState<VisionSequence>; perish?: SequenceState<PerishSequence>; pointer?: SequenceState<PointerSequence>; marker?: SequenceState<MarkerSequence>; message?: SequenceState<MessageSequence>; decay?: SequenceState<DecaySequence>; evaporate?: SequenceState<VanishSequence>; vanish?: SequenceState<VanishSequence>; burn?: SequenceState<BurnSequence>; freeze?: SequenceState<FreezeSequence>; smoke?: SequenceState<SmokeSequence>; flash?: SequenceState<FlashSequence>; dispose?: SequenceState<DisposeSequence>; revive?: SequenceState<ReviveSequence>; collect?: SequenceState<CollectSequence>; unlock?: SequenceState<UnlockSequence>; focus?: SequenceState<FocusSequence>; melee?: SequenceState<MeleeSequence>; condition?: SequenceState<ConditionSequence>; arrow?: SequenceState<ArrowSequence>; slash?: SequenceState<SlashSequence>; tornado?: SequenceState<TornadoSequence>; branch?: SequenceState<BranchSequence>; limb?: SequenceState<LimbSequence>; npc?: SequenceState<NpcSequence>; quest?: SequenceState<QuestSequence>; interact?: SequenceState<InteractSequence>; discovery?: SequenceState<DiscoverySequence>; dialog?: SequenceState<DialogSequence>; progress?: SequenceState<ProgressSequence>; xp?: SequenceState<XpSequence>; vortex?: SequenceState<VortexSequence>; fountain?: SequenceState<FountainSequence>; popup?: SequenceState<PopupSequence>; }` |

Attach with `world.addComponentToEntity(entity, SEQUENCABLE, data)`. Query with `world.getEntities([SEQUENCABLE])`.

Systems: `action`, `ai`, `ballistics`, `burn`, `collect`, `consume`, `damage`, `drop`, `fate`, `freeze`, `harvest`, `homing`, `interact`, `leveling`, `magic`, `map`, `popup`, `renderer`, `sequence`, `text`, `trigger`, `water`.
<!-- source-types -->

## EmptyObject

```ts src/engine/components/sequencable.ts
type EmptyObject = Record<string, never>;
```

## ConsumeSequence

```ts src/engine/components/sequencable.ts
export type ConsumeSequence = { itemId: number };
```

## DropSequence

```ts src/engine/components/sequencable.ts
export type DropSequence = {
  height: number;
  fast: boolean;
  type: Exclude<Liquid["type"], "bubble">;
};
```

## WeatherSequence

```ts src/engine/components/sequencable.ts
export type WeatherSequence = {
  position: Position;
  viewable: Position;
  start: number;
  end: number;
  intensity: number;
  ratio?: number;
  generation: number;
  drops: {
    position: Position;
    fast: boolean;
    timestamp: number;
    particle: string;
  }[];
  type: Weather;
};
```

## VisionSequence

```ts src/engine/components/sequencable.ts
export type VisionSequence = {
  light?: Light;
  previousLight?: Light;
  fast: boolean;
};
```

## PerishSequence

```ts src/engine/components/sequencable.ts
export type PerishSequence = { fast: boolean };
```

## PointerSequence

```ts src/engine/components/sequencable.ts
export type PointerSequence = {
  target?: number;
  lastOrientation?: Orientation;
};
```

## MarkerSequence

```ts src/engine/components/sequencable.ts
export type MarkerSequence = {
  amount: number;
  type: MarkerType;
  orientation?: Orientation;
};
```

## Message

```ts src/engine/components/sequencable.ts
export type Message = {
  line: Sprite[];
  orientation: Orientation;
  fast: boolean;
  delay: number;
  stack?: number;
};
```

## MessageSequence

```ts src/engine/components/sequencable.ts
export type MessageSequence = {
  messages: Message[];
  index: number;
  lastMessage: number;
};
```

## DecaySequence

```ts src/engine/components/sequencable.ts
export type DecaySequence = { fast: boolean };
```

## EvaporateSequence

```ts src/engine/components/sequencable.ts
export type EvaporateSequence = { fast: boolean; sprite: Sprite };
```

## VanishSequence

```ts src/engine/components/sequencable.ts
export type VanishSequence = {
  type: Vanishable["type"];
  generation: number;
  grow: boolean;
  limbs?: Record<
    string,
    {
      generation: number;
      delta: Position;
      evaporated: boolean;
      decayed: boolean;
    }
  >;
  remaining: number;
};
```

## BurnSequence

```ts src/engine/components/sequencable.ts
export type BurnSequence = {
  generation: number;
  castable?: number;
  exertable?: number;
  igniter?: number;
  lastAffected?: Castable["affected"][number];
};
```

## FreezeSequence

```ts src/engine/components/sequencable.ts
export type FreezeSequence = {
  total: number;
};
```

## SmokeSequence

```ts src/engine/components/sequencable.ts
export type SmokeSequence = {
  generation: number;
  extinguish: number;
  simmer: boolean;
};
```

## FlashSequence

```ts src/engine/components/sequencable.ts
export type FlashSequence = { targets: Position[] };
```

## DisposeSequence

```ts src/engine/components/sequencable.ts
export type DisposeSequence = EmptyObject;
```

## ReviveSequence

```ts src/engine/components/sequencable.ts
export type ReviveSequence = {
  target: Position;
  viewable: Viewable;
  light: Light;
  compassId?: number;
} & (
  | {
      tombstoneId?: number;
      origin: Position;
    }
  | {
      tombstoneId: number;
      origin?: Position;
    }
);
```

## CollectSequence

```ts src/engine/components/sequencable.ts
export type CollectSequence = {
  origin: Position;
  itemId: number;
  drop: boolean;
  delay?: number;
  amount: number;
};
```

## UnlockSequence

```ts src/engine/components/sequencable.ts
export type UnlockSequence = { origin: Position; item: Item };
```

## FocusSequence

```ts src/engine/components/sequencable.ts
export type FocusSequence = EmptyObject;
```

## MeleeSequence

```ts src/engine/components/sequencable.ts
export type MeleeSequence = {
  tick: number;
  facing: Orientation;
  rotate: boolean;
};
```

## ConditionSequence

```ts src/engine/components/sequencable.ts
export type ConditionSequence = {
  modifier: number;
  material: Material;
  orientation?: Orientation;
};
```

## SpellSequence

```ts src/engine/components/sequencable.ts
export type SpellSequence = {
  element?: Element;
  material?: Material;
  progress: number;
  memory?: any;
  duration: number;
  range: number;
  areas: number[];
};
```

## AuraSequence

```ts src/engine/components/sequencable.ts
export type AuraSequence = SpellSequence;
```

## ArrowSequence

```ts src/engine/components/sequencable.ts
export type ArrowSequence = { origin: Position; range: number; caster: number };
```

## SlashSequence

```ts src/engine/components/sequencable.ts
export type SlashSequence = {
  material: Material;
  element?: Element;
  castable: number;
  exertables: number[];
  tick: number;
};
```

## TornadoSequence

```ts src/engine/components/sequencable.ts
export type TornadoSequence = {
  material?: Material;
  element?: Element;
  amount: number;
  radius: number;
  position: Position;
  exertables: number[];
  generation: number;
  last?: number;
  gusts: {
    index: number;
    radius: number;
    generation: number;
    orientation: Orientation;
  }[];
};
```

## BranchSequence

```ts src/engine/components/sequencable.ts
export type BranchSequence = {
  threshold: number;
  limbs: number[];
  grow: boolean;
  shrink?: number;
};
```

## LimbSequence

```ts src/engine/components/sequencable.ts
export type LimbSequence = {
  type?: "wormMouth" | "golemFist";
  orientation?: Orientation;
  position: Position;
  areas: number[];
};
```

## NpcSequence

```ts src/engine/components/sequencable.ts
export type NpcSequence = { step: string; lastStep?: string; memory: any };
```

## QuestSequence

```ts src/engine/components/sequencable.ts
export type QuestSequence = {
  step: string;
  lastStep?: string;
  memory: any;
  giver?: number;
};
```

## InteractSequence

```ts src/engine/components/sequencable.ts
export type InteractSequence = {
  active: boolean;
  orientation: Orientation;
  generation: number;
  text: string;
  sprite: Sprite;
  offset: Position;
};
```

## DiscoverySequence

```ts src/engine/components/sequencable.ts
export type DiscoverySequence = {
  idle: Sprite;
  timestamp: number;
  hidden: boolean;
  force?: boolean;
};
```

## DialogSequence

```ts src/engine/components/sequencable.ts
export type DialogSequence = {
  orientation?: Orientation;
  text: Sprite[];
  active: boolean;
  timestamp: number;
  lengthOffset: number;
  isDialog: boolean;
  isIdle: boolean;
  isEnemy: boolean;
  overridden: boolean;
};
```

## XpSequence

```ts src/engine/components/sequencable.ts
export type XpSequence = { generation: number };
```

## VortexSequence

```ts src/engine/components/sequencable.ts
export type VortexSequence = { generation: number };
```

## FountainSequence

```ts src/engine/components/sequencable.ts
export type FountainSequence = {
  generation: number;
  entered?: number;
  healed?: number;
};
```

## ProgressSequence

```ts src/engine/components/sequencable.ts
export type ProgressSequence = {
  level: number;
  note: number;
  ring: number;
  xp: number;
  maxXp: number;
  maxMp: number;
  maxHp: number;
};
```

## PopupSequence

```ts src/engine/components/sequencable.ts
export type PopupSequence = {
  windowHeight: number;
  contentIndex: number;
  contentHeight: number;
  contentClickable: boolean;
  detailsPadding: number;
  generation?: number;
  scrollIndex?: number;
  verticalIndex: number;
  horizontalIndex: number;
  transaction: Popup["tabs"][number];
  instant: boolean;
};
```

## SequenceState

```ts src/engine/components/sequencable.ts
export type SequenceState<A> = {
  name: keyof typeof sequences; // TODO: only allow valid keys
  reference: number;
  elapsed: number;
  args: A;
  particles: Record<string, number>;
};
```

## Sequence

```ts src/engine/components/sequencable.ts
export type Sequence<A> = (
  world: World,
  entity: Entity,
  state: SequenceState<A>
) => { finished: boolean; updated: boolean };
```

## Sequencable

```ts src/engine/components/sequencable.ts
export type Sequencable = {
  states: {
    consume?: SequenceState<ConsumeSequence>;
    spell?: SequenceState<SpellSequence>;
    aura?: SequenceState<AuraSequence>;
    drop?: SequenceState<DropSequence>;
    weather?: SequenceState<WeatherSequence>;
    vision?: SequenceState<VisionSequence>;
    perish?: SequenceState<PerishSequence>;
    pointer?: SequenceState<PointerSequence>;
    marker?: SequenceState<MarkerSequence>;
    message?: SequenceState<MessageSequence>;
    decay?: SequenceState<DecaySequence>;
    evaporate?: SequenceState<VanishSequence>;
    vanish?: SequenceState<VanishSequence>;
    burn?: SequenceState<BurnSequence>;
    freeze?: SequenceState<FreezeSequence>;
    smoke?: SequenceState<SmokeSequence>;
    flash?: SequenceState<FlashSequence>;
    dispose?: SequenceState<DisposeSequence>;
    revive?: SequenceState<ReviveSequence>;
    collect?: SequenceState<CollectSequence>;
    unlock?: SequenceState<UnlockSequence>;
    focus?: SequenceState<FocusSequence>;
    melee?: SequenceState<MeleeSequence>;
    condition?: SequenceState<ConditionSequence>;
    arrow?: SequenceState<ArrowSequence>;
    slash?: SequenceState<SlashSequence>;
    tornado?: SequenceState<TornadoSequence>;
    branch?: SequenceState<BranchSequence>;
    limb?: SequenceState<LimbSequence>;
    npc?: SequenceState<NpcSequence>;
    quest?: SequenceState<QuestSequence>;
    interact?: SequenceState<InteractSequence>;
    discovery?: SequenceState<DiscoverySequence>;
    dialog?: SequenceState<DialogSequence>;
    progress?: SequenceState<ProgressSequence>;
    xp?: SequenceState<XpSequence>;
    vortex?: SequenceState<VortexSequence>;
    fountain?: SequenceState<FountainSequence>;
    popup?: SequenceState<PopupSequence>;
  };
};
```
