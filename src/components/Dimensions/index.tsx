import { DimensionsProvider, useDimensions, DimensionOptions } from "./sizing";
import ScrollLock from "./scrolling";
import "./index.css";

export { useDimensions };

export { isTouch } from "../../renderers/interface/platform";

/**
 * Prevent mobile browsers from trying to scroll and thus collapse the window height.
 * Provides screen dimensions as context.
 */
export default function Dimensions({
  options,
  ...props
}: React.ComponentProps<"div"> & { options?: DimensionOptions }) {
  return (
    <DimensionsProvider options={options}>
      <ScrollLock {...props} options={options} />
    </DimensionsProvider>
  );
}
