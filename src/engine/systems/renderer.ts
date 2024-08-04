import { World } from "../ecs";

export default function setupRenderer(world: World) {
  let lastGeneration = -1;

  const onUpdate = (delta: number) => {

    const generation = world.metadata.generation;
    if (lastGeneration === generation) return;

    lastGeneration = generation;

    for (const listener of Object.values(world.metadata.listeners)) {
      listener();
    }
  }

  return { onUpdate };
}