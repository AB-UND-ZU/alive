import { Entity } from "ecs";
import { World } from "../ecs";
import { CellType } from "../../bindings/creation";

export type Buildable = {
  cell: CellType;
};

export const BUILDABLE = "BUILDABLE";

export default function addBuildable(
  world: World,
  entity: Entity,
  buildable: Buildable
) {
  world.addComponentToEntity(entity, BUILDABLE, buildable);
}
