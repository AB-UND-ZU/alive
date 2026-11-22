import {
  Actor,
  Canvas,
  Color,
  DarknessComponent,
  Entity,
  LightOccluderComponent,
  PointLightComponent,
  TransformComponent,
  Vector,
} from "excalibur";
import {
  characterWidth,
  characterHeight,
} from "../../components/Row/characters";
import { LIGHT } from "../../engine/components/light";
import { getOpaqueOrientation } from "../../game/math/tracing";

// A DOS cell has nine columns. Its left half-block occupies four of them.
const walls = {
  full: [characterWidth, characterHeight, 0, 0],
  left: [4, characterHeight, -2.5, 0],
  right: [5, characterHeight, 2, 0],
  up: [characterWidth, 8, 0, -4],
  down: [characterWidth, 8, 0, 4],
};

const veil = { color: Color.Black, intensity: 0.64 };
const wholeCell = {
  shape: { kind: "box", width: characterWidth, height: characterHeight },
};

// The reference renderer draws the light radius above wall faces and below fog.
// Native occluders darken the terrain behind walls on a separate layer.
function createLightCover(scene) {
  const actor = new Actor({ z: 3, anchor: Vector.Zero });
  actor.graphics.forceOnScreen = true;
  scene.add(actor);
  let holes = [];
  const cover = new Canvas({
    width: 1,
    height: 1,
    padding: 0,
    cache: true,
    draw(ctx) {
      ctx.fillStyle = "rgba(0,0,0,0.64)";
      ctx.fillRect(0, 0, cover.width, cover.height);
      ctx.globalCompositeOperation = "destination-out";
      for (const { x, y, radius } of holes) {
        if (radius <= 0) continue;
        const light = ctx.createRadialGradient(
          x,
          y,
          Math.max(0, radius - 0.5),
          x,
          y,
          radius
        );
        light.addColorStop(0, "black");
        light.addColorStop(1, "transparent");
        ctx.fillStyle = light;
        ctx.fillRect(x - radius, y - radius, 2 * radius, 2 * radius);
      }
    },
  });
  actor.graphics.use(cover);
  return (lights) => {
    actor.graphics.isVisible = lights.length > 0;
    if (!lights.length) return;
    const { camera, engine } = scene;
    const { width, height } = engine.screen.resolution;
    // Leave a tile around the viewport for camera shake.
    const w = Math.ceil(width / camera.zoom) + 2 * characterWidth;
    const h = Math.ceil(height / camera.zoom) + 2 * characterHeight;
    const left = Math.floor(camera.pos.x - w / 2);
    const top = Math.floor(camera.pos.y - h / 2);
    actor.pos.setTo(left, top);
    const next = lights.map(({ x, y, radius }) => ({
      x: x - left,
      y: y - top,
      radius,
    }));
    if (
      cover.width === w &&
      cover.height === h &&
      next.length === holes.length &&
      next.every(
        (point, i) =>
          point.x === holes[i].x &&
          point.y === holes[i].y &&
          point.radius === holes[i].radius
      )
    )
      return;
    holes = next;
    cover.width = w;
    cover.height = h;
    cover.flagDirty();
  };
}

export function createLighting(scene) {
  const entities = new Map();
  let generation = 0;
  const cover = createLightCover(scene);

  function place(key, Component, x, y, options) {
    let record = entities.get(key);
    if (!record) {
      const transform = new TransformComponent();
      const component = new Component(options);
      const entity = new Entity([transform, component]);
      scene.add(entity);
      record = { entity, transform, component };
      entities.set(key, record);
    }
    record.generation = generation;
    if (record.transform.pos.x !== x || record.transform.pos.y !== y) {
      record.transform.pos.setTo(x, y);
    }
    return record.component;
  }

  return (world, entries, enabled) => {
    generation++;
    const lights = enabled
      ? entries.filter(
          ({ entity, inside }) => entity[LIGHT].brightness > 0 && !inside
        )
      : [];
    scene.engine.lighting.zIndex = 1;
    scene.engine.lighting.enabled = lights.length > 0;

    const circles = [];
    if (lights.length) {
      place("darkness", DarknessComponent, 0, 0, veil);
      for (const { entity, key, x, y } of lights) {
        const cx = (x + 0.5) * characterWidth;
        const cy = (y + 0.5) * characterHeight;
        const radius =
          Math.max(0, entity[LIGHT].brightness - 0.25) * characterHeight;
        place("light:" + key, PointLightComponent, cx, cy).radius = radius;
        circles.push({ x: cx, y: cy, radius });
      }

      for (const { entity, key, x, y } of entries) {
        if (entity[LIGHT].darkness <= 0) continue;
        if (
          !lights.some(
            (light) =>
              Math.abs((light.x - x) * characterWidth) <=
                (light.entity[LIGHT].brightness + 1) * characterHeight &&
              Math.abs(light.y - y) <= light.entity[LIGHT].brightness + 1
          )
        )
          continue;
        const [width, height, dx, dy] =
          walls[getOpaqueOrientation(world, entity) || "full"];
        const wall = place(
          "wall:" + key,
          LightOccluderComponent,
          (x + 0.5) * characterWidth + dx,
          (y + 0.5) * characterHeight + dy,
          wholeCell
        );
        if (wall.shape.width !== width || wall.shape.height !== height) {
          wall.shape = { kind: "box", width, height };
        }
      }
    }
    cover(circles);
    for (const [key, record] of entities) {
      if (record.generation !== generation) {
        scene.world.remove(record.entity, false);
        entities.delete(key);
      }
    }
  };
}
