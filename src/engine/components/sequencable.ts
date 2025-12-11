import { Entity } from "ecs";
import { World } from "../ecs";
import * as sequences from "../../game/assets/sequences";
import { Orientation } from "./orientable";
import { Sprite } from "./sprite";
import { Position } from "./position";
import { Viewable } from "./viewable";
import { Light } from "./light";
import { Element, Item, Material } from "./item";
import { Popup } from "./popup";
import { Liquid } from "./liquid";
import { Castable, DamageType } from "./castable";

type EmptyObject = Record<string, never>;

export type ConsumeSequence = { itemId: number };
export type BubbleSequence = { width: number; type: Liquid["type"] };
export type RainSequence = { height: number; fast: boolean };
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
export type MarkerSequence = { amount: number; type: DamageType };
export type Message = {
  line: Sprite[];
  orientation: Orientation;
  fast: boolean;
  delay: number;
  stack?: number;
};
export type MessageSequence = {
  messages: Message[];
  index: number;
  lastMessage: number;
};
export type DecaySequence = { fast: boolean };
export type BurnSequence = {
  generation: number;
  castable?: number;
  exertable?: number;
  igniter?: number;
  lastAffected?: Castable["affected"][number];
};
export type FreezeSequence = {
  total: number;
};
export type SmokeSequence = {
  generation: number;
  extinguish: number;
  simmer: boolean;
};
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
export type UnlockSequence = { origin: Position; item: Item };
export type FocusSequence = EmptyObject;
export type MeleeSequence = {
  tick: number;
  facing: Orientation;
  rotate: boolean;
};
export type SpellSequence = {
  element?: Element;
  material: Material;
  progress: number;
  memory?: any;
  duration: number;
  range: number;
  areas: number[];
};
export type ArrowSequence = { origin: Position; range: number; caster: number };
export type SlashSequence = {
  material: Material;
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
export type DiscoverySequence = {
  idle: Sprite;
  timestamp: number;
  hidden: boolean;
  force?: boolean;
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
export type XpSequence = { generation: number };
export type VortexSequence = { generation: number };
export type FountainSequence = {
  generation: number;
  entered?: number;
  healed?: number;
};
export type ProgressSequence = {
  dropped: boolean;
  maxMp: number;
  maxHp: number;
};
export type PopupSequence = {
  contentIndex: number;
  contentHeight: number;
  generation?: number;
  scrollIndex?: number;
  verticalIndex: number;
  horizontalIndex: number;
  transaction: Popup["tabs"][number];
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
    rain?: SequenceState<RainSequence>;
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
    discovery?: SequenceState<DiscoverySequence>;
    dialog?: SequenceState<DialogSequence>;
    progress?: SequenceState<ProgressSequence>;
    xp?: SequenceState<XpSequence>;
    vortex?: SequenceState<VortexSequence>;
    fountain?: SequenceState<FountainSequence>;
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
