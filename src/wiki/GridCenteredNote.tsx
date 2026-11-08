import { ReactNode, useLayoutEffect, useRef, useState } from "react";

export function GridCenteredNote({ children }: { children: ReactNode }) {
  const note = useRef<HTMLParagraphElement>(null);
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const element = note.current;
    const frame = element?.previousElementSibling as HTMLElement | null;
    if (!element || !frame) return;
    const measure = () => {
      const beside =
        element.getBoundingClientRect().left >=
        frame.getBoundingClientRect().right;
      setTop(
        beside
          ? Math.max(
              0,
              Math.floor((frame.offsetHeight - element.offsetHeight) / 64) * 32
            )
          : 0
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    observer.observe(frame);
    if (element.parentElement) observer.observe(element.parentElement);
    return () => observer.disconnect();
  }, []);
  return (
    <p className="PreviewInstruction" ref={note} style={{ marginTop: top }}>
      {children}
    </p>
  );
}
