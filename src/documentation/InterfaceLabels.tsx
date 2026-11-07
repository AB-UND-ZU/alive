import { useDimensions } from "../components/Dimensions";
import Row from "../components/Row";
import { createText } from "../game/assets/ui";
import { colors } from "../game/assets/colors";
export function InterfaceLabels() {
  const { padding } = useDimensions();
  const indent = (columns: number) => " ".repeat(Math.max(0, columns));
  const labels = [
    { top: 4, text: indent(padding) + "↑ Pause    ↑ Stats" },
    { top: 5, text: indent(padding + 3) + "↑ HP / MP / XP" },
    { top: 6, text: indent(padding + 14) + "Use ↑" },
    { top: 7, text: "← Terminal →" },
    { top: 8, text: "  Move and inspect" },
    { top: 11, text: "Equipped actions ↓" },
    { top: 15, text: indent(padding + 1) + "Skill Spell" },
    { top: 16, text: indent(padding + 3) + "↓     ↓" },
  ];
  return (
    <div
      className="InterfaceLabels"
      role="img"
      aria-label="Pause, stats, terminal and equipped action controls"
    >
      {labels.map(({ top, text }) => (
        <div
          key={top}
          style={{
            position: "absolute",
            top: `calc(var(--cell-height) * ${top})`,
            left: 0,
          }}
        >
          <Row
            cells={createText(
              text
                .replaceAll("↑", "\u0117")
                .replaceAll("↓", "\u0118")
                .replaceAll("←", "\u011a")
                .replaceAll("→", "\u0119"),
              colors.white,
              colors.black
            )}
          />
        </div>
      ))}
    </div>
  );
}
