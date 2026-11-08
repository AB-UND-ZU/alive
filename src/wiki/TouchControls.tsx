import { useEffect, useRef, useState } from "react";
import { degreesToOrientations, pointToDegree } from "../game/math/tracing";
import { Orientation } from "../engine/components/orientable";
import Joystick from "../components/Joystick";
import { useDimensions } from "../components/Dimensions";
import { joystick } from "../game/assets/sprites";
import { characterMarkup } from "../components/Row/characters";

export const nativeTouch =
  navigator.maxTouchPoints > 0 ||
  window.matchMedia("(pointer: coarse)").matches ||
  "ontouchstart" in window;

export function enableTouchEmulation() {
  if (nativeTouch) return () => {};
  let touch: Touch | undefined;
  const dispatch = (
    type: "touchstart" | "touchmove" | "touchend" | "touchcancel",
    active: boolean
  ) => {
    if (!touch) return;
    const init = {
      bubbles: true,
      cancelable: true,
      touches: active ? [touch] : [],
      targetTouches: active ? [touch] : [],
      changedTouches: [touch],
    };
    const event =
      typeof Touch === "function" && typeof TouchEvent === "function"
        ? new TouchEvent(type, init)
        : Object.assign(new Event(type, { bubbles: true, cancelable: true }), {
            touches: init.touches,
            targetTouches: init.targetTouches,
            changedTouches: init.changedTouches,
          });
    window.dispatchEvent(event);
  };
  const at = (event: MouseEvent, target: EventTarget) => {
    const init = {
      identifier: 1,
      target,
      clientX: event.clientX,
      clientY: event.clientY,
      pageX: event.pageX,
      pageY: event.pageY,
      screenX: event.screenX,
      screenY: event.screenY,
      radiusX: 1,
      radiusY: 1,
      rotationAngle: 0,
      force: 1,
    };
    return typeof Touch === "function" ? new Touch(init) : (init as Touch);
  };
  const finish = (cancel = false) => {
    dispatch(cancel ? "touchcancel" : "touchend", false);
    touch = undefined;
    document.body.classList.remove("wiki-touch-held");
  };
  const down = (event: MouseEvent) => {
    if (event.button !== 0) return;
    touch = at(event, event.target || document.body);
    document.body.classList.add("wiki-touch-held");
    dispatch("touchstart", true);
  };
  const move = (event: MouseEvent) => {
    if (!touch) return;
    if (
      !(event.buttons & 1) ||
      event.clientX < 0 ||
      event.clientX >= window.innerWidth ||
      event.clientY < 0 ||
      event.clientY >= window.innerHeight
    ) {
      finish(true);
      return;
    }
    touch = at(event, touch.target);
    dispatch("touchmove", true);
  };
  const up = () => finish();
  const cancel = () => finish(true);
  const leave = (event: MouseEvent) => {
    if (!event.relatedTarget) cancel();
  };
  const hidden = () => {
    if (document.hidden) cancel();
  };
  window.addEventListener("mousedown", down, true);
  window.addEventListener("mousemove", move, true);
  window.addEventListener("mouseup", up, true);
  window.addEventListener("mouseout", leave, true);
  window.addEventListener("blur", cancel);
  document.addEventListener("visibilitychange", hidden);
  return () => {
    cancel();
    window.removeEventListener("mousedown", down, true);
    window.removeEventListener("mousemove", move, true);
    window.removeEventListener("mouseup", up, true);
    window.removeEventListener("mouseout", leave, true);
    window.removeEventListener("blur", cancel);
    document.removeEventListener("visibilitychange", hidden);
  };
}

export function TouchCursor() {
  const { cellWidth, cellHeight } = useDimensions();
  if (nativeTouch) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cellWidth}" height="${cellHeight}" viewBox="0 0 9 16">${characterMarkup(
    joystick.layers
  )}</svg>`;
  const cursor = `url("data:image/svg+xml,${encodeURIComponent(
    svg
  )}") ${Math.round(cellWidth / 2)} ${Math.round(cellHeight / 2)}, auto`;
  return (
    <style
      data-touch-cursor
    >{`body, body.no-cursor { cursor: ${cursor}; } body.wiki-touch-held:has(.Controls .Joystick) { cursor:none; }`}</style>
  );
}

export function JoystickReference() {
  const { cellWidth, cellHeight } = useDimensions();
  const reference = useRef<HTMLDivElement>(null);
  const [directions, setDirections] = useState<Orientation[]>(
    nativeTouch ? ["up", "right", "down", "left"] : ["up"]
  );
  useEffect(() => {
    if (nativeTouch) return;
    const point = (event: MouseEvent) => {
      const bounds = reference.current?.getBoundingClientRect();
      if (!bounds) return;
      const next = degreesToOrientations(
        pointToDegree({
          x: event.clientX - bounds.x - bounds.width / 2,
          y: event.clientY - bounds.y - bounds.height / 2,
        })
      );
      setDirections((previous) =>
        previous.join() === next.join() ? previous : next
      );
    };
    window.addEventListener("mousemove", point);
    return () => window.removeEventListener("mousemove", point);
  }, []);
  return (
    <div
      ref={reference}
      aria-label="Touch joystick direction reference"
      style={{
        position: "relative",
        transform: "translateZ(0)",
        width: "calc(var(--cell-width) * 3)",
        height: "calc(var(--cell-height) * 3)",
      }}
    >
      <Joystick
        orientations={directions}
        origin={[cellWidth * 1.5, cellHeight * 1.5]}
      />
    </div>
  );
}
