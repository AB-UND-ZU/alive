import { Entity } from "ecs";
import { World } from "../ecs";
import { CellType } from "../../bindings/creation";

export type Remainable = {
  cell?: CellType;
};

export const REMAINABLE = "REMAINABLE";

export default function addRemainable(
  world: World,
  entity: Entity,
  remainable: Remainable
) {
  world.addComponentToEntity(entity, REMAINABLE, remainable);
}
