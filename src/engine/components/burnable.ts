import { Entity } from "ecs";
import { World } from "../ecs";
import { Sprite } from "./sprite";

export type Burnable = {
  burning: boolean;
  eternal: boolean;
  combusted: boolean;
  remains?: Sprite;
};

export const BURNABLE = "BURNABLE";

export default function addBurnable(
  world: World,
  entity: Entity,
  burnable: Burnable
) {
  world.addComponentToEntity(entity, BURNABLE, burnable);
}
