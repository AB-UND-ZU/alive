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
  const width = columns * dimensions.cellWidth;
  const height = rows * dimensions.cellHeight;
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
              width,
              height,
              left: `calc(50% - ${width / 2}px)`,
              top: `calc(50% - ${height / 2}px)`,
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
