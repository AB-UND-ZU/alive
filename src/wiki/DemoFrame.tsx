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
    window.addEventListener("touchstart", focus, true);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("focus", focus);
      window.removeEventListener("touchstart", focus, true);
      window.removeEventListener("blur", blur);
    };
  }, []);
  const columns = island
    ? Math.floor(dimensions.terminalWidth / dimensions.cellWidth)
    : 23;
  const rows = island
    ? Math.round(dimensions.terminalHeight / dimensions.cellHeight)
    : 15;
  const color = focused ? colors.lime : colors.silver;
  return (
    <div
      className="DemoFrame"
      aria-hidden="true"
      data-columns={columns}
      data-rows={rows}
      style={
        island
          ? undefined
          : {
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
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
