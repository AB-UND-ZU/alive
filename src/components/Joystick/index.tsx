import { createText, joystick, none } from "../../game/assets/sprites";
import * as colors from "../../game/assets/colors";
import { useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { Orientation } from "../../engine/components/orientable";

export default function Joystick({
  orientations,
  origin,
}: {
  orientations: Orientation[];
  origin?: [number, number];
}) {
  const dimensions = useDimensions();

  if (!origin || orientations.length === 0) return null;

  return (
    <div className="Joystick" style={{ top: origin[1] - dimensions.cellHeight * 1.5, left: origin[0] - dimensions.cellWidth * 1.5 }}>
      <Row
        cells={[
          none,
          orientations.includes("up")
            ? createText(
                "\u0117",
                orientations[0] === "up" ? colors.white : colors.grey
              )[0]
            : none,
          none,
        ]}
      />
      <Row
        cells={[
          orientations.includes("left")
            ? createText(
                "\u011a",
                orientations[0] === "left" ? colors.white : colors.grey
              )[0]
            : none,
            joystick,
          orientations.includes("right")
            ? createText(
                "\u0119",
                orientations[0] === "right" ? colors.white : colors.grey
              )[0]
            : none,
        ]}
      />
      <Row
        cells={[
          none,
          orientations.includes("down")
            ? createText(
                "\u0118",
                orientations[0] === "down" ? colors.white : colors.grey
              )[0]
            : none,
          none,
        ]}
      />
    </div>
  );
}
