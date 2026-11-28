import type { World } from "../ecs";
import type { TypedEntity } from "../entities";
import type { Item } from "./item";
import type { SpriteRef } from "./sprite";

export const petTraits = [
  "water",
  "plants",
  "aggression",
  "survival",
  "hunger",
  "movement",
  "distance",
  "vocal",
  "thirst",
  "moody",
] as const;
export const petSkills = [
  "collect",
  "attack",
  "heal",
  "mana",
  "harvest",
  "disc",
  "aura",
] as const;
export type PetTrait = (typeof petTraits)[number];
export type PetSkill = (typeof petSkills)[number];
export type PetFood = Omit<Item, "amount" | "carrier" | "bound">;

export type Tameable = {
  owner?: number;
  favourites: { item: PetFood; xp: number }[];
  stat: "hp" | "melee" | "armor" | "haste";
  attributes: Partial<Record<PetTrait, boolean>>;
  skills: PetSkill[];
  heartColor?: string;
  expressionUntil?: number;
  thirsty?: boolean;
  kills?: number;
  healingHits?: number;
  ghost?: SpriteRef;
};

export const TAMEABLE = "TAMEABLE";

export default function addTameable(
  world: World,
  entity: TypedEntity,
  tameable: Tameable
) {
  world.addComponentToEntity(entity, TAMEABLE, tameable);
}
