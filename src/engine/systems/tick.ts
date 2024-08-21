import { World } from "../ecs";
import { isProcessable, REFERENCE } from "../components/reference";
import { rerenderEntity } from "./renderer";

export default function setupTick(world: World) {
  const onUpdate = (delta: number) => {
    // add delta to reference frames
    for (const entity of world.getEntities([REFERENCE])) {
      const reference = entity[REFERENCE];

      // skip if suspended reference has passed
      if (isProcessable(reference) && reference.suspended) continue;

      reference.delta += delta;


      // tick reference frames
      if (!isProcessable(reference) || reference.suspended) continue;

      reference.delta -= reference.tick;

      if (reference.pendingSuspended) {
        reference.suspended = true;
        reference.delta = 0;
      }

      rerenderEntity(world, entity);
    }
  };

  return { onUpdate };
}
