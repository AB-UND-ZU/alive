import { World } from "../ecs";
import { isProcessable, REFERENCE } from "../components/reference";
import { rerenderEntity } from "./renderer";

export default function setupTick(world: World) {
  const onUpdate = (delta: number) => {
    // add delta to reference frames
    for (const entity of world.getEntities([REFERENCE])) {
      const reference = entity[REFERENCE];

      const frameSkipped = Math.min(delta, reference.tick);

      // skip if suspended reference has passed
      if (isProcessable(reference) && reference.suspended) continue;

      reference.delta += frameSkipped;

      // clamp suspended references
      if (reference.suspended && reference.delta > reference.tick) {
        reference.delta = reference.tick;
      }

      // tick reference frames
      if (!isProcessable(reference) || reference.suspended) continue;

      if (reference.suspensionCounter > 0) {
        reference.suspensionCounter -= 1;
      }

      if (reference.suspensionCounter === 0) {
        reference.suspended = true;
      } else {
        reference.delta -= reference.tick;
        rerenderEntity(world, entity);
      }
    }
  };

  return { onUpdate };
}
