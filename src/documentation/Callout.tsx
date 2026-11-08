import { ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Pixels, textSprites, TextColorContext } from "./visuals";
import { colors } from "../game/assets/colors";
export function Callout({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  const content = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState(1);
  useLayoutEffect(() => {
    const measure = () =>
      setLines(
        Math.max(1, Math.ceil((content.current?.clientHeight || 32) / 32))
      );
    measure();
    const observer = new ResizeObserver(measure);
    if (content.current) observer.observe(content.current);
    return () => observer.disconnect();
  }, []);
  return (
    <aside className="Callout" role="note" aria-label={label}>
      <Pixels
        rows={Array.from({ length: lines }, () =>
          textSprites(">", colors.lime)
        )}
      />
      <div ref={content}>
        <TextColorContext.Provider value={colors.white}>
          {children}
        </TextColorContext.Provider>
      </div>
    </aside>
  );
}
