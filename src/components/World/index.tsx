import { useState } from "react";
import { generateWorld } from "../../bindings";
import { createWorld } from "../../engine";
import { WorldProvider } from "../../bindings/hooks";
import { useDimensions } from "../Dimensions";

export default function World(props: React.PropsWithChildren) {
  const dimensions = useDimensions();
  // generate initial world
  // TODO: find better way to prevent double generation
  const [context] = useState(() => {
    const ecs = createWorld(dimensions.mapSize);
    setTimeout(generateWorld, 0, ecs);
    return { ecs };
  });

  return <WorldProvider value={context} {...props} />;
}
