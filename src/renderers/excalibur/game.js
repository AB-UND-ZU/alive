import {
  Color,
  DefaultLoader,
  DisplayMode,
  Engine,
  ExcaliburGraphicsContext2DCanvas,
  PointerScope,
} from "excalibur";
import {
  characterHeight,
  characterWidth,
} from "../../components/Row/characters";
import { releaseCameraMotion, updateCameraMotion } from "../../engine/motion";
import { maxFrameDelta, systemsFrame } from "../interface/clock";
import { getSceneFrame } from "../interface/frame";
import { getActiveViewable } from "../interface/hooks";
import { createGraphics } from "./graphics";
import { createLighting } from "./lighting";

export function startGame(canvas, read) {
  const { world } = read();
  const engine = new Engine({
    canvasElement: canvas,
    global: canvas,
    pointerScope: PointerScope.Canvas,
    width: 1,
    height: 1,
    displayMode: DisplayMode.Fixed,
    pixelRatio: 1,
    pixelArt: true,
    uvPadding: 0,
    antialiasing: { multiSampleAntialiasing: false },
    snapToPixel: false,
    backgroundColor: Color.Black,
    physics: false,
    fixedUpdateTimestep: systemsFrame,
    grabWindowFocus: false,
    suppressConsoleBootMessage: true,
    suppressPlayButton: true,
  });
  const scene = engine.currentScene;
  engine.input.setEnabled(false);
  // Scene activation enables a second input host. Alive owns the canvas gestures.
  scene.on("activate", () => scene.input.setEnabled(false));
  const draw = createGraphics(scene);
  const light = createLighting(scene);
  const state = { stickyCastables: {} };
  updateCameraMotion(world, true);

  const surface = canvas.parentElement;
  let bounds = surface.getBoundingClientRect();
  const resize = new ResizeObserver(([entry]) => {
    bounds = entry.contentRect;
  });
  resize.observe(surface);

  let disposed = false;
  let damage;
  let shakeUntil = 0;
  let previousFrame;
  engine.on("preframe", () => {
    const now = engine.clock.now();
    const delta = now - previousFrame;
    previousFrame = now;
    // Excalibur 1.0 reports 1 ms for a stalled frame. Restore the bounded
    // elapsed time before its fixed-step scheduler computes the number of turns.
    engine.timescale =
      engine.clock.elapsed() === 1 && delta > systemsFrame
        ? Math.min(delta, maxFrameDelta)
        : 1;
  });

  scene.on("preupdate", ({ elapsed }) => {
    const { paused, suspended } = read();
    if (!disposed && !paused && !suspended) world.update(elapsed);
  });

  scene.on("predraw", () => {
    if (disposed) return;
    const {
      columns,
      rows,
      cellWidth,
      cellHeight,
      paused,
      suspended,
      shadows = true,
    } = read();
    if (suspended) return;
    if (!paused) {
      world.metadata.renderTime =
        world.metadata.elapsed + engine.currentFrameLag;
    }
    const now = world.metadata.renderTime;

    const density = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(bounds.width * density));
    const height = Math.max(1, Math.round(bounds.height * density));
    const screen = engine.screen;
    if (
      screen.resolution.width !== width ||
      screen.resolution.height !== height
    ) {
      screen.resolution = { width, height };
      screen.viewport = { width: bounds.width, height: bounds.height };
      screen.applyResolutionAndViewport();
    }
    scene.camera.zoom = (cellHeight * density) / characterHeight;
    if (engine.graphicsContext instanceof ExcaliburGraphicsContext2DCanvas) {
      screen.antialiasing = !Number.isInteger(scene.camera.zoom);
    }
    scene.camera.pos.setTo(
      (columns * characterWidth) / 2,
      (rows * characterHeight) / 2
    );

    const hero = world.getEntities(["PLAYER"])[0];
    const stats = hero?.PLAYER.receivedStats;
    const received =
      stats && (stats.melee || 0) + (stats.magic || 0) + (stats.true || 0);
    const viewpoint = getActiveViewable(
      world.getEntities(["VIEWABLE", "POSITION"])
    );
    const quake =
      viewpoint?.VIEWABLE.quake >
      world.metadata.gameEntity.RENDERABLE.generation;
    if (!paused && damage !== undefined && received > damage) {
      const strength = (Math.sqrt(received - damage) + 1) * 1.6;
      scene.camera.shake(strength, strength, 100);
    } else if (!paused && quake && now >= shakeUntil) {
      scene.camera.shake(4, 4, 100);
      shakeUntil = now + 100;
    }
    damage = received;
    const lights = [];
    const entries = getSceneFrame(world, columns, rows, state, {
      includeHidden: true,
      pixelsPerCell: { x: cellWidth * density, y: cellHeight * density },
      onLight: shadows
        ? (entity, x, y, inside, key) =>
            lights.push({ entity, x, y, inside, key })
        : undefined,
    });
    draw(world, entries);
    light(world, lights, shadows);
  });

  const ready = engine.start(new DefaultLoader());
  return () => {
    disposed = true;
    resize.disconnect();
    releaseCameraMotion(world);
    // Startup initializes the director asynchronously, even with no assets.
    void ready.finally(() => engine.dispose());
  };
}
