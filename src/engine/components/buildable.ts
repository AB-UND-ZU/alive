import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { CellType } from "../../bindings/creation";

export type Buildable = {
  cell: CellType;
};

export const BUILDABLE = "BUILDABLE";

export default function addBuildable(
  world: World,
  entity: TypedEntity,
  buildable: Buildable
) {
  world.addComponentToEntity(entity, BUILDABLE, buildable);
}
