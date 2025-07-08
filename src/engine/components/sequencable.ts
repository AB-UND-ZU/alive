import { Entity } from "ecs";
import { World } from "../ecs";
import * as sequences from "../../game/assets/sequences";
import { Orientation } from "./orientable";
import { Sprite } from "./sprite";
import { Position } from "./position";
import { Viewable } from "./viewable";
import { Light } from "./light";
import { Element } from "./item";
import { Shoppable } from "./shoppable";

type EmptyObject = Record<string, never>;

export type ConsumeSequence = { itemId: number };
export type BubbleSequence = { width: number };
export type VisionSequence = {
  light?: Light;
  previousLight?: Light;
  fast: boolean;
};
export type PerishSequence = { fast: boolean };
export type PointerSequence = {
  target?: number;
  lastOrientation?: Orientation;
};
export type MarkerSequence = { amount: number };
export type MessageSequence = {
  message: Sprite[];
  orientation: Orientation;
  fast: boolean;
};
export type DecaySequence = { fast: boolean };
export type BurnSequence = {
  generation: number;
  lastTick?: number;
  lastDot?: number;
  castable?: number;
  exertable?: number;
};
export type FreezeSequence = {
  total: number;
};
export type SmokeSequence = { generation: number; extinguish: number };
export type DisposeSequence = EmptyObject;
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
export type CollectSequence = {
  origin: Position;
  itemId: number;
  drop: boolean;
  delay?: number;
  amount: number;
};
export type UnlockSequence = { origin: Position; itemId: number };
export type FocusSequence = EmptyObject;
export type MeleeSequence = { tick: number; facing: Orientation };
export type SpellSequence = {
  element: Element | "default" | "wild";
  progress: number;
  memory?: any;
  duration: number;
  range: number;
  areas: number[];
};
export type ArrowSequence = { origin: Position; range: number; caster: number };
export type SlashSequence = {
  material: "wood" | "iron";
  castable: number;
  exertables: number[];
  tick: number;
};
export type NpcSequence = { step: string; lastStep?: string; memory: any };
export type QuestSequence = {
  step: string;
  lastStep?: string;
  memory: any;
  giver?: number;
};
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
export type ProgressSequence = {
  dropped: boolean;
  maxMp: number;
  maxHp: number;
};
export type PopupSequence = {
  selectedIndex: number;
  generation?: number;
  contentIndex: number;
  transaction: Shoppable["transaction"];
};

export type SequenceState<A> = {
  name: keyof typeof sequences; // TODO: only allow valid keys
  reference: number;
  elapsed: number;
  args: A;
  particles: Record<string, number>;
};
export type Sequence<A> = (
  world: World,
  entity: Entity,
  state: SequenceState<A>
) => { finished: boolean; updated: boolean };

export type Sequencable = {
  states: {
    consume?: SequenceState<ConsumeSequence>;
    spell?: SequenceState<SpellSequence>;
    bubble?: SequenceState<BubbleSequence>;
    vision?: SequenceState<VisionSequence>;
    perish?: SequenceState<PerishSequence>;
    pointer?: SequenceState<PointerSequence>;
    marker?: SequenceState<MarkerSequence>;
    message?: SequenceState<MessageSequence>;
    decay?: SequenceState<DecaySequence>;
    burn?: SequenceState<BurnSequence>;
    freeze?: SequenceState<FreezeSequence>;
    smoke?: SequenceState<SmokeSequence>;
    dispose?: SequenceState<DisposeSequence>;
    revive?: SequenceState<ReviveSequence>;
    collect?: SequenceState<CollectSequence>;
    unlock?: SequenceState<UnlockSequence>;
    focus?: SequenceState<FocusSequence>;
    melee?: SequenceState<MeleeSequence>;
    arrow?: SequenceState<ArrowSequence>;
    slash?: SequenceState<SlashSequence>;
    npc?: SequenceState<NpcSequence>;
    quest?: SequenceState<QuestSequence>;
    dialog?: SequenceState<DialogSequence>;
    progress?: SequenceState<ProgressSequence>;
    popup?: SequenceState<PopupSequence>;
  };
};

export const SEQUENCABLE = "SEQUENCABLE";

export default function addSequencable(
  world: World,
  entity: Entity,
  sequencable: Sequencable
) {
  world.addComponentToEntity(entity, SEQUENCABLE, sequencable);
}
