import { useState } from "react";
import { generate } from "../../worlds";
import { createWorld } from "../../engine";
import { WorldProvider, useWorld } from "./hooks";

export { useWorld };

export default function World(props: React.PropsWithChildren) {
  // generate initial world
  // TODO: find better way to prevent double generation
  const [context] = useState(() => {
    const world = createWorld();
    setTimeout(generate, 0, world);
    return { world };
  });

  return <WorldProvider value={context} {...props} />;
}
