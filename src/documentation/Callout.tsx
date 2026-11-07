import { ReactNode } from "react";
import { Pixels, textSprites } from "./visuals";
import { colors } from "../game/assets/colors";
export function Callout({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <aside className="Callout" role="note" aria-label={label}>
      <Pixels rows={[textSprites(">", colors.lime)]} />
      <div>{children}</div>
    </aside>
  );
}
