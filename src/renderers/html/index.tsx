import { CSSProperties, useEffect, useReducer, useMemo, useRef } from "react";
import { RendererCapabilities, RendererProps } from "../interface/types";
import { characterMarkup } from "../../components/Row/characters";
import { getSceneFrame } from "../interface/frame";
import "./style.css";
import { createFrameClock } from "../interface/clock";
import {
  updateCameraMotion,
  releaseCameraMotion,
  getCameraMotion,
  sampleMotion,
} from "../../engine/motion";
import { useWorld } from "../interface/hooks";
import { PLAYER } from "../../engine/components/player";
import { random } from "../../game/math/std";
import { colors } from "../../game/assets/colors";
import { fogOfWar } from "../../game/assets/sprites";

const fogLayers = [{ char: "▓", color: colors.black }];
const swimmingLayers = [{ char: "▄", color: colors.navy }];

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
  const { suspended } = useWorld();
  const [, render] = useReducer((value) => value + 1, 0);
  const clock = useMemo(() => createFrameClock(world), [world]);
  const pausedRef = useRef(paused);
  pausedRef.current = paused || suspended;
  useEffect(() => {
    if (paused || suspended) clock.reset();
  }, [clock, paused, suspended]);
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
  const shake = useMemo(
    () => ({
      world,
      received: undefined as number | undefined,
      started: -Infinity,
      x: 0,
      y: 0,
    }),
    [world]
  );
  const hero = world.getEntities([PLAYER])[0];
  if (hero) {
    const received =
      (hero[PLAYER].receivedStats.melee || 0) +
      (hero[PLAYER].receivedStats.magic || 0) +
      (hero[PLAYER].receivedStats.true || 0);
    if (shake.received !== undefined && received > shake.received) {
      const distance = (Math.sqrt(received - shake.received) + 1) * 0.1;
      const angle = (random(0, 359) / 360) * Math.PI * 2;
      shake.started = world.metadata.renderTime;
      shake.x = Math.sin(angle) * distance;
      shake.y = -Math.cos(angle) * distance;
    }
    shake.received = received;
  }
  const cameraMotion = getCameraMotion(world);
  const camera = cameraMotion
    ? sampleMotion(cameraMotion, world.metadata.renderTime)
    : { x: 0, y: 0 };
  const phase = (world.metadata.renderTime - shake.started - 50) / 50;
  const factor = phase < 0 || phase >= 2 ? 0 : phase < 1 ? phase : 2 - phase;
  const pixel = (value: number) => {
    const ratio = window.devicePixelRatio || 1;
    return Math.round(value * ratio) / ratio;
  };
  if (suspended) return null;
  const scene = getSceneFrame(world, columns, rows, sceneState, {
    includeHidden: true,
  });
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
      <div
        className="HtmlRendererScene"
        style={{
          transform: `translate(${pixel(
            shake.x * factor * cellHeight - camera.x * cellWidth
          )}px, ${pixel((shake.y * factor - camera.y) * cellHeight)}px)`,
        }}
      >
        {scene.map((entry) => {
          const layers = entry.swimming
            ? swimmingLayers
            : entry.sprite === fogOfWar
            ? fogLayers
            : entry.layers;
          const backgroundColor =
            layers.length === 1 && layers[0].char === "█"
              ? layers[0].color
              : undefined;
          return (
            <span
              key={entry.key}
              className="HtmlRendererSprite"
              style={{
                opacity: entry.hidden ? 0 : 1,
                backgroundColor,
                boxShadow: backgroundColor
                  ? `0 0 0 ${
                      0.5 / (window.devicePixelRatio || 1)
                    }px ${backgroundColor}`
                  : undefined,
                left: `calc(50% + ${
                  (entry.x + camera.x - columns / 2) * cellWidth
                }px)`,
                top: `calc(50% + ${
                  (entry.y + camera.y - rows / 2) * cellHeight
                }px)`,
              }}
            >
              {layers.length === 1 ? (
                <span
                  className="HtmlRendererCharacter"
                  style={{ color: layers[0].color }}
                >
                  {layers[0].char}
                </span>
              ) : layers.length > 1 ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 9 16"
                  preserveAspectRatio="none"
                  shapeRendering="crispEdges"
                  dangerouslySetInnerHTML={{
                    __html: characterMarkup(layers),
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
                        top: `${
                          ((13 + Math.floor(index / 5) * 2) / 16) * 100
                        }%`,
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
          );
        })}
      </div>
    </div>
  );
}
