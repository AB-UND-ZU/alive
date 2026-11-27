import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Spikable = {
  damage: number;
};

export const SPIKABLE = "SPIKABLE";

export default function addSpikable(
  world: World,
  entity: TypedEntity,
  spikable: Spikable
) {
  world.addComponentToEntity(entity, SPIKABLE, spikable);
}
