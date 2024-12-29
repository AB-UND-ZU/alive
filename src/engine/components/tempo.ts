import { Entity } from "ecs";
import { World } from "../ecs";

export type Tempo = {
  amount: number;
};

export const TEMPO = "TEMPO";

export default function addTempo(
  world: World,
  entity: Entity,
  tempo: Tempo
) {
  world.addComponentToEntity(entity, TEMPO, tempo);
}
