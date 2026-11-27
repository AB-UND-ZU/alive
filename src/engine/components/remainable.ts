import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { CellType } from "../../bindings/creation";

export type Remainable = {
  cell?: CellType;
};

export const REMAINABLE = "REMAINABLE";

export default function addRemainable(
  world: World,
  entity: TypedEntity,
  remainable: Remainable
) {
  world.addComponentToEntity(entity, REMAINABLE, remainable);
}
