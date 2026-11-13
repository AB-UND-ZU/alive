import { CSSProperties, useEffect, useReducer, useMemo, useRef } from "react";
import { RendererCapabilities, RendererProps } from "../interface/types";
import { characterMarkup } from "../../components/Row/characters";
import { getSceneFrame } from "../interface/frame";
import "./style.css";
import { createFrameClock } from "../interface/clock";
import { updateCameraMotion, releaseCameraMotion } from "../../engine/motion";

export const capabilities: RendererCapabilities = {
  lighting: false,
  shadows: false,
  healthBars: true,
  stackDots: true,
  smoothMovement: true,
};

export default function HtmlRenderer({
  world,
  columns,
  rows,
  cellWidth,
  cellHeight,
  paused,
}: RendererProps) {
  const [, render] = useReducer((value) => value + 1, 0);
  const clock = useMemo(() => createFrameClock(world), [world]);
  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  useEffect(() => {
    if (paused) clock.reset();
  }, [clock, paused]);
  useEffect(() => {
    updateCameraMotion(world, true);
    let frame: number;
    let previous = performance.now();
    const update = (time: number) => {
      clock.advance(time - previous, pausedRef.current);
      previous = time;
      render();
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(frame);
      releaseCameraMotion(world);
    };
  }, [world, clock]);
  const sceneState = useMemo(() => ({ world, stickyCastables: {} }), [world]);
  const scene = getSceneFrame(world, columns, rows, sceneState);
  return (
    <div
      className="HtmlRenderer"
      aria-label="Game world"
      style={
        {
          "--html-cell-width": `${cellWidth}px`,
          "--html-cell-height": `${cellHeight}px`,
        } as CSSProperties
      }
    >
      {scene.map((entry) => (
        <span
          key={entry.key}
          className="HtmlRendererSprite"
          style={{
            left: `calc(50% + ${(entry.x - columns / 2) * cellWidth}px)`,
            top: `calc(50% + ${(entry.y - rows / 2) * cellHeight}px)`,
          }}
        >
          {entry.layers.length === 1 ? (
            <span
              className="HtmlRendererCharacter"
              style={{ color: entry.layers[0].color }}
            >
              {entry.layers[0].char}
            </span>
          ) : entry.layers.length > 1 ? (
            <svg
              aria-hidden="true"
              viewBox="0 0 9 16"
              preserveAspectRatio="none"
              shapeRendering="crispEdges"
              dangerouslySetInnerHTML={{
                __html: characterMarkup(entry.layers),
              }}
            />
          ) : null}
          {entry.dots !== undefined && (
            <span className="HtmlRendererDots">
              {Array.from({ length: entry.dots }, (_, index) => (
                <i
                  key={index}
                  style={{
                    left: `${(((index % 5) * 2) / 9) * 100}%`,
                    top: `${((13 + Math.floor(index / 5) * 2) / 16) * 100}%`,
                  }}
                />
              ))}
            </span>
          )}
          {entry.hp && (
            <span
              className="HtmlRendererHealth"
              style={{
                left: `${(0.5 + entry.hp.x - entry.hp.scale / 2) * 100}%`,
                top: `${(13 / 16 + entry.hp.y) * 100}%`,
                width: `${((entry.hp.scale * 8) / 9) * 100}%`,
                color: entry.hp.color,
              }}
            >
              <span
                style={{
                  width: `${
                    Math.min(1, entry.hp.value / entry.hp.maximum) * 100
                  }%`,
                }}
              />
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
