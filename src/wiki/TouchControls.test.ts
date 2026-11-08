import { enableTouchEmulation } from "./TouchControls";

test("mouse gestures dispatch native touch input and stop after release or leaving", () => {
  const received: { type: string; x?: number; count: number }[] = [];
  const record = (event: Event) => {
    const e = event as TouchEvent;
    received.push({
      type: e.type,
      x: e.changedTouches[0]?.clientX,
      count: e.touches.length,
    });
  };
  for (const type of ["touchstart", "touchmove", "touchend", "touchcancel"])
    window.addEventListener(type, record);
  const cleanup = enableTouchEmulation();
  const mouse = (type: string, x: number, buttons = 1) =>
    document.body.dispatchEvent(
      new MouseEvent(type, {
        bubbles: true,
        clientX: x,
        clientY: 20,
        button: 0,
        buttons,
      })
    );
  try {
    mouse("mousedown", 20);
    mouse("mousemove", 60);
    mouse("mouseup", 60, 0);
    expect(received.map((e) => e.type)).toEqual([
      "touchstart",
      "touchmove",
      "touchend",
    ]);
    expect(received[1]).toEqual({ type: "touchmove", x: 60, count: 1 });
    expect(received[2].count).toBe(0);
    mouse("mousedown", 20);
    window.dispatchEvent(new Event("blur"));
    mouse("mousemove", 60);
    expect(received.slice(3).map((e) => e.type)).toEqual([
      "touchstart",
      "touchcancel",
    ]);
    mouse("mousedown", 20);
    window.dispatchEvent(new MouseEvent("mouseout", { relatedTarget: null }));
    mouse("mousemove", 60);
    expect(received.slice(5).map((e) => e.type)).toEqual([
      "touchstart",
      "touchcancel",
    ]);
    expect(document.body).not.toHaveClass("wiki-touch-held");
  } finally {
    cleanup();
    for (const type of ["touchstart", "touchmove", "touchend", "touchcancel"])
      window.removeEventListener(type, record);
  }
});
