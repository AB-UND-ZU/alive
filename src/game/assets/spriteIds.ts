import type {
  Layer,
  Sprite,
  SpriteArtwork,
  SpriteRef,
} from "../../engine/components/sprite";
import * as sprites from "./sprites";
import { orderedColors } from "./colors";

export const namedSprites = new Map(
  Object.values(sprites).map((sprite) => [sprite.id, sprite])
);

export function namedSprite(id: string, artwork: SpriteArtwork): Sprite {
  const sprite = { ...artwork, id };
  namedSprites.set(id, sprite);
  return sprite;
}

export const colorToCode = (color: string) =>
  String.fromCharCode(orderedColors.indexOf(color));

// The ordinary form is a DOS color followed by characters. A suffix preserves
// names, alternate views and the few layers outside the 16-color palette.
const suffix = "\x1f";
export function spriteDefinition({
  layers,
  name,
  facing,
  amounts,
  terminal,
}: SpriteArtwork) {
  let text = "";
  let previous: string | undefined;
  let exactLayers: Layer[] | undefined;
  for (const { char, color } of layers) {
    if (
      char.length !== 1 ||
      char.charCodeAt(0) < 32 ||
      !orderedColors.includes(color)
    ) {
      exactLayers = layers;
      text = "";
      break;
    }
    if (color !== previous) text += colorToCode(color);
    text += char;
    previous = color;
  }
  text ||= "\x0f";
  if (name !== undefined || facing || amounts || terminal || exactLayers)
    text +=
      suffix +
      JSON.stringify({ name, facing, amounts, terminal, layers: exactLayers });
  return text;
}

export const customSprite = (artwork: SpriteArtwork): Sprite => ({
  ...artwork,
  id: spriteDefinition(artwork),
});

function readDefinition(definition: string): SpriteArtwork {
  const separator = definition.indexOf(suffix);
  const text = separator < 0 ? definition : definition.slice(0, separator);
  const layers: Layer[] = [];
  let color = orderedColors[15];
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code < 16) color = orderedColors[code];
    else layers.push({ char, color });
  }
  return {
    layers,
    ...(separator < 0 ? {} : JSON.parse(definition.slice(separator + 1))),
  };
}

export function parseSprite(definition: string): Sprite {
  return customSprite(readDefinition(definition));
}

export function spriteRef({ id }: SpriteRef): SpriteRef {
  return id.charCodeAt(0) < 16 ? { id, custom: true } : { id };
}

const parsed = new WeakMap<SpriteRef, Sprite>();
export function resolveSprite(ref: SpriteRef): Sprite;
export function resolveSprite(ref: SpriteRef | undefined): Sprite | undefined;
export function resolveSprite(ref?: SpriteRef) {
  if (!ref) return;
  if (!ref.custom) {
    const sprite = namedSprites.get(ref.id);
    if (!sprite) throw new Error(`Unknown sprite ID: ${ref.id}`);
    return sprite;
  }
  let sprite = parsed.get(ref);
  if (sprite?.id !== ref.id) {
    sprite = { ...readDefinition(ref.id), id: ref.id };
    parsed.set(ref, sprite);
  }
  return sprite;
}
