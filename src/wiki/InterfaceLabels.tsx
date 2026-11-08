import { useDimensions } from "../components/Dimensions";
import Row from "../components/Row";
import {
  createText,
  createButton,
  getStatSprite,
  getStatColor,
} from "../game/assets/ui";
import { colors } from "../game/assets/colors";
export function InterfaceLabels() {
  const d = useDimensions();
  const left = (d.columns - 21) / 2;
  const line = (x: number, y: number, text: string) => (
    <div
      key={x + ":" + y}
      style={{
        position: "absolute",
        left: x * d.cellWidth,
        top: y * d.cellHeight,
      }}
    >
      <Row cells={createText(text, colors.white, colors.black)} />
    </div>
  );
  return (
    <div
      className="InterfaceLabels"
      aria-label="Pause, stats, quick actions, skill, spell and gear controls"
    >
      {line(left + 1, 0, "\u0117")}
      {line(left - 1, 1, "Pause")}
      {line(left - 4, 2, "(auto-save)")}
      {line(left + 9, 0, "\u0117")}
      {line(left + 7, 1, "Stats")}
      {(["hp", "mp", "xp"] as const).map((stat, index) => (
        <div
          key={stat}
          data-stat-label={stat}
          style={{
            position: "absolute",
            left: (left + 8) * d.cellWidth,
            top: (index + 2) * d.cellHeight,
          }}
        >
          <Row
            cells={[
              getStatSprite(stat, "display"),
              ...createText(
                stat.toUpperCase(),
                getStatColor(stat),
                colors.black
              ),
            ]}
          />
        </div>
      ))}
      {line(left + 18, 0, "\u0117")}
      {line(left + 16, 1, "Quick")}
      {line(left + 15, 2, "actions")}
      {["BAG", "EQUIP", "GEAR", "STATS", "MAP"].map((label, index) => (
        <div
          key={label}
          aria-label={label}
          data-quick-action={label}
          style={{
            position: "absolute",
            left: (left + 15) * d.cellWidth,
            top: (index + 3) * d.cellHeight,
          }}
        >
          <Row cells={createButton(label, 7, false, false, false, "yellow")} />
        </div>
      ))}
      {line(left + 1, 10, "Skill")}
      {line(left + 3, 11, "\u0118")}
      {line(left + 7, 10, "Spell")}
      {line(left + 9, 11, "\u0118")}
      {line(left + 15, 10, "Gear")}
      {line(left + 16.5, 11, "\u0118")}
    </div>
  );
}
