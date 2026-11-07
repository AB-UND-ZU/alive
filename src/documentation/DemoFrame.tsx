import { useEffect, useState } from "react";
import Row from "../components/Row";
import { useDimensions } from "../components/Dimensions";
import { colors } from "../game/assets/colors";
import { createText } from "../game/assets/ui";

export function DemoFrame({ island = false }: { island?: boolean }) {
  const dimensions = useDimensions();
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const focus = () => setFocused(true),
      blur = () => setFocused(false);
    window.addEventListener("focus", focus);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("focus", focus);
      window.removeEventListener("blur", blur);
    };
  }, []);
  const columns = island
    ? Math.floor(dimensions.terminalWidth / dimensions.cellWidth)
    : 21;
  const rows = island
    ? Math.round(dimensions.terminalHeight / dimensions.cellHeight)
    : 13;
  const color = focused ? colors.lime : colors.silver;
  return (
    <div
      className="DemoFrame"
      aria-hidden="true"
      style={
        island
          ? undefined
          : {
              left:
                (dimensions.terminalWidth - columns * dimensions.cellWidth) / 2,
              top: dimensions.terminalHeight / 2 - 6.5 * dimensions.cellHeight,
              width: columns * dimensions.cellWidth,
              height: rows * dimensions.cellHeight,
            }
      }
    >
      {Array.from({ length: rows }, (_, index) => (
        <Row
          key={index}
          cells={createText(
            index === 0
              ? "┌" + "─".repeat(columns - 2) + "┐"
              : index === rows - 1
              ? "└" + "─".repeat(columns - 2) + "┘"
              : "│" + " ".repeat(columns - 2) + "│",
            color
          )}
        />
      ))}
    </div>
  );
}
