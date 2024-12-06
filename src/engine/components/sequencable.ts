import { Entity } from "ecs";
import { World } from "../ecs";
import * as sequences from "../../game/assets/sequences";
import { Orientation } from "./orientable";
import { Sprite } from "./sprite";
import { Position } from "./position";
import { Viewable } from "./viewable";
import { Light } from "./light";

type EmptyObject = Record<string, never>;

export type BubbleSequence = { width: number };
export type VisionSequence = { light?: Light; previousLight?: Light, fast: boolean };
export type PerishSequence = EmptyObject;
export type PointerSequence = {
  target?: number;
  lastOrientation?: Orientation;
};
export type HitSequence = { damage: number };
export type DecaySequence = EmptyObject;
export type BurnSequence = { generation: number };
export type DisposeSequence = EmptyObject;
export type ReviveSequence = {
  target: Position;
  viewable: Viewable;
  light: Light;
  compassId?: number;
} & ({
  tombstoneId?: number;
  origin: Position;
} | {
  tombstoneId: number;
  origin?: Position;
});
export type CollectSequence = {
  origin: Position;
  itemId: number;
  drop?: number;
};
export type UnlockSequence = { origin: Position; itemId: number };
export type FocusSequence = EmptyObject;
export type MeleeSequence = { facing: Orientation; damage: number };
export type ArrowSequence = { origin: Position; range: number; };
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
  after?: number;
  isDialog: boolean;
  isIdle: boolean;
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
    bubble?: SequenceState<BubbleSequence>;
    vision?: SequenceState<VisionSequence>;
    perish?: SequenceState<PerishSequence>;
    pointer?: SequenceState<PointerSequence>;
    hit?: SequenceState<HitSequence>;
    decay?: SequenceState<DecaySequence>;
    burn?: SequenceState<BurnSequence>;
    dispose?: SequenceState<DisposeSequence>;
    revive?: SequenceState<ReviveSequence>;
    collect?: SequenceState<CollectSequence>;
    unlock?: SequenceState<UnlockSequence>;
    focus?: SequenceState<FocusSequence>;
    melee?: SequenceState<MeleeSequence>;
    arrow?: SequenceState<ArrowSequence>;
    npc?: SequenceState<NpcSequence>;
    quest?: SequenceState<QuestSequence>;
    dialog?: SequenceState<DialogSequence>;
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
