import type { TypedEntity } from "../entities";
import { World } from "../ecs";
import { Orientation } from "./orientable";

export type Amount = "single" | "double" | "multiple";

export type Layer = {
  char: string;
  color: string;
};
export type SpriteLayers = {
  layers: Layer[];
  facing?: Partial<Record<Orientation, Layer[]>>;
  amounts?: Partial<Record<Amount, Layer[]>>;
};
export type SpriteArtwork = SpriteLayers & {
  name?: string;
  terminal?: SpriteLayers;
};
export type Sprite = SpriteArtwork & {
  id: string;
};

export type SpriteRef =
  | { id: string; custom?: false }
  | { id: string; custom: true; definition: string };

export const SPRITE = "SPRITE";

export default function addSprite(
  world: World,
  entity: TypedEntity,
  sprite: SpriteRef
) {
  world.addComponentToEntity(entity, SPRITE, sprite);
}
