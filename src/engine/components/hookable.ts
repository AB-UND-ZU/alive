import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Hookable = {
  hooked?: number;
  catching?: number;
  escaping: boolean;
};

export const HOOKABLE = "HOOKABLE";

export default function addHookable(
  world: World,
  entity: TypedEntity,
  hookable: Hookable
) {
  world.addComponentToEntity(entity, HOOKABLE, hookable);
}
