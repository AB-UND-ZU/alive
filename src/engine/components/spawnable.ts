import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Position } from "./position";
import { Light } from "./light";
import { Viewable } from "./viewable";
import { ClassKey } from "../../game/balancing/classes";
import { QuestSequence, SequenceState } from "./sequencable";

export type Spawnable = {
  classKey: ClassKey;
  hairColor: string;
  position: Position;
  light: Light;
  viewable: Viewable;
  compassId?: number;
  quest?: SequenceState<QuestSequence>;
};

export const SPAWNABLE = "SPAWNABLE";

export default function addSpawnable(
  world: World,
  entity: TypedEntity,
  spawnable: Spawnable
) {
  world.addComponentToEntity(entity, SPAWNABLE, spawnable);
}
