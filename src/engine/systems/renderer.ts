import ECS, { World } from "ecs";
import { MAP } from "../components/map";
import { RENDERABLE } from "../components/renderable";

export default function setupRenderer(world: World) {
  let lastGeneration = -1;

  const onUpdate = (delta: number) => {
    const metadata = ECS.getEntity(world, [MAP, RENDERABLE]);

    if (!metadata) return;

    const generation = metadata[RENDERABLE].generation;
    if (lastGeneration === generation) return;

    lastGeneration = generation;

    for (const listener of Object.values(metadata[MAP].listeners)) {
      // TODO: fix type
      (listener as () => void)();
    }
  }

  return { onUpdate };
}