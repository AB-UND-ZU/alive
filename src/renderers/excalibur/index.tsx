import { useEffect, useRef } from "react";
import { useWorld } from "../interface/hooks";
import type { RendererProps } from "../interface/types";
import { startGame } from "./game";
import "./style.css";

export { capabilities } from "./capabilities";

export default function ExcaliburRenderer(props: RendererProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const { suspended } = useWorld();
  const latest = useRef({ ...props, suspended });
  latest.current = { ...props, suspended };

  useEffect(() => {
    const surface = canvas.current!;
    let mounted = true;
    let dispose: (() => void) | undefined;
    // StrictMode mounts twice. Only the committed surface needs a graphics context.
    queueMicrotask(() => {
      if (mounted) dispose = startGame(surface, () => latest.current);
    });
    return () => {
      mounted = false;
      dispose?.();
    };
  }, [props.world]);

  return (
    <div className="ExcaliburRenderer" hidden={suspended}>
      <canvas
        ref={canvas}
        aria-label="Game world"
        tabIndex={-1}
        onClick={(event) => event.currentTarget.focus({ preventScroll: true })}
      />
    </div>
  );
}
