import { Entity } from "ecs";
import { World } from "../ecs";

export type Spikable = {
  damage: number;
};

export const SPIKABLE = "SPIKABLE";

export default function addSpikable(
  world: World,
  entity: Entity,
  spikable: Spikable
) {
  world.addComponentToEntity(entity, SPIKABLE, spikable);
}
