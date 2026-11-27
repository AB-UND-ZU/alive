import type { TypedEntity } from "../entities";
import { World } from "../ecs";

export type Tempo = {
  amount: number;
};

export const TEMPO = "TEMPO";

export default function addTempo(
  world: World,
  entity: TypedEntity,
  tempo: Tempo
) {
  world.addComponentToEntity(entity, TEMPO, tempo);
}
