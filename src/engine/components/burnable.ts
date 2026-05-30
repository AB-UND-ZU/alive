import { Entity } from "ecs";
import { World } from "../ecs";

export type Burnable = {
  burning: boolean;
  eternal: boolean;
  simmer: boolean;
  combusted: boolean;
  decayed: boolean;
};

export const BURNABLE = "BURNABLE";

export default function addBurnable(
  world: World,
  entity: Entity,
  burnable: Burnable
) {
  world.addComponentToEntity(entity, BURNABLE, burnable);
}
