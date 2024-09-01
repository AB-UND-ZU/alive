import { DimensionsProvider, useDimensions } from "./sizing";
import ScrollLock from "./scrolling";
import "./index.css";

export { useDimensions };

export const isTouch = window.matchMedia("(pointer: coarse)").matches;

/**
 * Prevent mobile browsers from trying to scroll and thus collapse the window height.
 * Provides screen dimensions as context.
 */
export default function Dimensions(props: React.ComponentProps<"div">) {
  return (
    <DimensionsProvider>
      <ScrollLock {...props} />
    </DimensionsProvider>
  );
}
