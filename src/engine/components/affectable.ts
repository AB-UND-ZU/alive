import { Entity } from "ecs";
import { World } from "../ecs";

export type Affectable = {
  burn: number;
  freeze: number;
};

export const AFFECTABLE = "AFFECTABLE";

export default function addAffectable(
  world: World,
  entity: Entity,
  affectable: Affectable
) {
  world.addComponentToEntity(entity, AFFECTABLE, affectable);
}
