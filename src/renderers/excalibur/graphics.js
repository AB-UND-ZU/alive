import {
  Actor,
  Canvas,
  Color,
  ExcaliburGraphicsContext2DCanvas,
  ImageFiltering,
} from "excalibur";
import {
  characterHeight,
  characterWidth,
  composeCharacterPixels,
} from "../../components/Row/characters";
import { getCameraMotion, sampleMotion } from "../../engine/motion";
import { getSequence } from "../../engine/systems/sequence";
import { colors } from "../../game/assets/colors";
import { shadowHeight, wallHeight } from "../interface/segments";

const swimming = [{ char: "▄", color: colors.navy }];
const fadeDuration = 200;
const healthTracks = Object.fromEntries(
  [colors.red, colors.lime, colors.silver].map((color) => [
    color,
    Color.fromHex(color).multiply(new Color(38, 38, 38)).toHex(),
  ])
);

function transition(previous, target, now, duration) {
  if (!previous) return { from: target, target, since: now, value: target };
  if (previous.target === target && previous.value === target) return previous;
  const t = Math.min(1, Math.max(0, (now - previous.since) / duration));
  previous.value = previous.from + (previous.target - previous.from) * t;
  if (previous.target !== target) {
    previous.from = previous.value;
    previous.target = target;
    previous.since = now;
  }
  return previous;
}

function glyph(layers, context) {
  const pixels = composeCharacterPixels(layers);
  return new Canvas({
    width: characterWidth,
    height: characterHeight,
    cache: true,
    // Canvas2D interpolates this bitmap directly at fractional zoom.
    quality: context instanceof ExcaliburGraphicsContext2DCanvas ? 3 : 1,
    filtering: ImageFiltering.Blended,
    smoothing: false,
    padding: 0,
    draw(ctx) {
      ctx.globalAlpha = 1;
      pixels.forEach((color, i) => {
        if (!color) return;
        ctx.fillStyle = color;
        ctx.fillRect(i % characterWidth, Math.floor(i / characterWidth), 1, 1);
      });
    },
  });
}

export function createGraphics(scene) {
  const glyphs = new Map();
  const layerKeys = new WeakMap();
  const blocks = new Map();
  const previous = new Map();
  let generation = 0;

  function block(context, color, x, y, width) {
    if (width <= 0) return;
    if (!blocks.has(color))
      blocks.set(color, glyph([{ char: "█", color }], context));
    context.save();
    context.translate(x, y);
    context.scale(width / characterWidth, 1 / characterHeight);
    blocks.get(color).draw(context, 0, 0);
    context.restore();
  }

  function createLayer(z) {
    const actor = new Actor({ z });
    const items = [];
    actor.graphics.forceOnScreen = true;
    actor.graphics.onPostDraw = (context) => {
      const opacity = context.opacity;
      for (const state of items) {
        const { entry, x, y } = state;
        context.opacity = opacity * state.opacity.value;
        const layers = entry.swimming ? swimming : entry.layers;
        if (layers.length) {
          let key = layerKeys.get(layers);
          if (!key) {
            key = JSON.stringify(layers);
            layerKeys.set(layers, key);
          }
          if (!glyphs.has(key)) glyphs.set(key, glyph(layers, context));
          glyphs.get(key).draw(context, x, y);
        }
        for (let i = 0; i < (entry.dots || 0); i++) {
          block(
            context,
            colors.silver,
            x + (i % 5) * 2,
            y + 13 + Math.floor(i / 5) * 2,
            1
          );
        }
        if (entry.hp) {
          const hp = entry.hp;
          const left = x + (0.5 + hp.x - hp.scale / 2) * characterWidth;
          const top = y + 13 + hp.y * characterHeight;
          const width = 8 * hp.scale;
          block(context, hp.color, left, top, width * state.health.value);
          if (state.health.value < 1) {
            block(
              context,
              healthTracks[hp.color],
              left + width * state.health.value,
              top,
              width * (1 - state.health.value)
            );
          }
        }
      }
      context.opacity = opacity;
    };
    scene.add(actor);
    return items;
  }
  const worldLayer = createLayer(0);
  const walls = createLayer(2);
  const overlay = createLayer(4);

  function enqueue(state) {
    if (state.opacity.value > 0) {
      const z = state.entry.z;
      (z < wallHeight ? worldLayer : z < shadowHeight ? walls : overlay).push(
        state
      );
    }
  }

  return function updateGraphics(world, entries) {
    const now = world.metadata.renderTime;
    const motion = getCameraMotion(world);
    const camera = motion && sampleMotion(motion, now);
    generation++;
    worldLayer.length = 0;
    walls.length = 0;
    overlay.length = 0;
    for (const entry of entries) {
      if (!entry.layers.length && !entry.swimming && !entry.dots && !entry.hp)
        continue;
      let key = entry.key;
      let dropping = false;
      if (entry.particle) {
        const seq = getSequence(world, entry.entity, "collect");
        if (
          seq?.args.drop &&
          world.getEntityId(entry.particle) === seq.particles.loot
        ) {
          key = key.replace(/particle\d+$/, `loot${seq.args.itemId}`);
          dropping = true;
        }
      }
      let state = previous.get(key);
      if (!state) {
        state = {};
        if (entry.loot && !dropping)
          state.opacity = transition(undefined, 0, now, fadeDuration);
        previous.set(key, state);
      }
      state.entry = entry;
      state.generation = generation;
      state.x = entry.x * characterWidth;
      state.y = entry.y * characterHeight;
      state.loot = entry.loot || dropping;
      if (state.loot) {
        state.worldX = entry.x + (camera?.x || 0);
        state.worldY = entry.y + (camera?.y || 0);
      }
      state.opacity = transition(
        state.opacity,
        entry.hidden ? 0 : 1,
        now,
        fadeDuration
      );
      if (entry.hp) {
        state.health = transition(
          state.health,
          Math.min(1, entry.hp.value / entry.hp.maximum),
          now,
          75
        );
      }
      enqueue(state);
    }
    let fading = false;
    for (const [key, state] of previous) {
      if (state.generation === generation) continue;
      if (
        state.loot &&
        transition(state.opacity, 0, now, fadeDuration).value > 0
      ) {
        state.x = (state.worldX - (camera?.x || 0)) * characterWidth;
        state.y = (state.worldY - (camera?.y || 0)) * characterHeight;
        enqueue(state);
        fading = true;
      } else previous.delete(key);
    }
    if (fading) {
      worldLayer.sort((a, b) => a.entry.z - b.entry.z);
      walls.sort((a, b) => a.entry.z - b.entry.z);
    }
  };
}
