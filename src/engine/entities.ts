import { World } from ".";
import { Actionable, ACTIONABLE } from "./components/actionable";
import { Attackable, ATTACKABLE } from "./components/attackable";
import { Behaviour, BEHAVIOUR } from "./components/behaviour";
import { Belongable, BELONGABLE } from "./components/belongable";
import { Burnable, BURNABLE } from "./components/burnable";
import { Collectable, COLLECTABLE } from "./components/collectable";
import { COLLIDABLE, Collidable } from "./components/collidable";
import { Displacable, DISPLACABLE } from "./components/displacable";
import { Droppable, DROPPABLE } from "./components/droppable";
import { Enterable, ENTERABLE } from "./components/enterable";
import { Equippable, EQUIPPABLE } from "./components/equippable";
import { Focusable, FOCUSABLE } from "./components/focusable";
import { Fog, FOG } from "./components/fog";
import { Identifiable, IDENTIFIABLE } from "./components/identifiable";
import { Immersible, IMMERSIBLE } from "./components/immersible";
import { Inventory, INVENTORY } from "./components/inventory";
import { Item, ITEM } from "./components/item";
import { Level, LEVEL, LevelName } from "./components/level";
import { Liquid, LIQUID } from "./components/liquid";
import { Light, LIGHT } from "./components/light";
import { Lockable, LOCKABLE } from "./components/lockable";
import { Lootable, LOOTABLE } from "./components/lootable";
import { Melee, MELEE } from "./components/melee";
import { Movable, MOVABLE } from "./components/movable";
import { Npc, NPC } from "./components/npc";
import { Orientable, ORIENTABLE } from "./components/orientable";
import { Particle, PARTICLE } from "./components/particle";
import { Player, PLAYER } from "./components/player";
import { Position, POSITION } from "./components/position";
import { Projectile, PROJECTILE } from "./components/projectile";
import { Pushable, PUSHABLE } from "./components/pushable";
import { Reference, REFERENCE } from "./components/reference";
import { Renderable, RENDERABLE } from "./components/renderable";
import { Revivable, REVIVABLE } from "./components/revivable";
import { Sequencable, SEQUENCABLE } from "./components/sequencable";
import { Soul, SOUL } from "./components/soul";
import { Spawnable, SPAWNABLE } from "./components/spawnable";
import { Spikable, SPIKABLE } from "./components/spikable";
import { Sprite, SPRITE } from "./components/sprite";
import { UnitStats, STATS } from "./components/stats";
import { Swimmable, SWIMMABLE } from "./components/swimmable";
import { Tooltip, TOOLTIP } from "./components/tooltip";
import { Trackable, TRACKABLE } from "./components/trackable";
import { Viewable, VIEWABLE } from "./components/viewable";
import { Castable, CASTABLE } from "./components/castable";
import { Affectable, AFFECTABLE } from "./components/affectable";
import { Exertable, EXERTABLE } from "./components/exertable";
import { Fragment, FRAGMENT } from "./components/fragment";
import { Structurable, STRUCTURABLE } from "./components/structurable";
import { Tempo, TEMPO } from "./components/tempo";
import { Layer, LAYER } from "./components/layer";
import { Popup, POPUP } from "./components/popup";
import { Freezable, FREEZABLE } from "./components/freezable";
import { Rechargable, RECHARGABLE } from "./components/rechargable";
import { Warpable, WARPABLE } from "./components/warpable";
import { Clickable, CLICKABLE } from "./components/clickable";

export type Entity = Record<LevelName, {}> & {
  [ACTIONABLE]: Actionable;
  [AFFECTABLE]: Affectable;
  [ATTACKABLE]: Attackable;
  [BEHAVIOUR]: Behaviour;
  [BELONGABLE]: Belongable;
  [BURNABLE]: Burnable;
  [CASTABLE]: Castable;
  [CLICKABLE]: Clickable;
  [COLLECTABLE]: Collectable;
  [COLLIDABLE]: Collidable;
  [DISPLACABLE]: Displacable;
  [DROPPABLE]: Droppable;
  [ENTERABLE]: Enterable;
  [EQUIPPABLE]: Equippable;
  [EXERTABLE]: Exertable;
  [FOCUSABLE]: Focusable;
  [FOG]: Fog;
  [FRAGMENT]: Fragment;
  [FREEZABLE]: Freezable;
  [IDENTIFIABLE]: Identifiable;
  [IMMERSIBLE]: Immersible;
  [INVENTORY]: Inventory;
  [ITEM]: Item;
  [LAYER]: Layer;
  [LEVEL]: Level;
  [LIQUID]: Liquid;
  [LIGHT]: Light;
  [LOCKABLE]: Lockable;
  [LOOTABLE]: Lootable;
  [MELEE]: Melee;
  [MOVABLE]: Movable;
  [NPC]: Npc;
  [ORIENTABLE]: Orientable;
  [PARTICLE]: Particle;
  [PLAYER]: Player;
  [POSITION]: Position;
  [PROJECTILE]: Projectile;
  [PUSHABLE]: Pushable;
  [RECHARGABLE]: Rechargable;
  [RENDERABLE]: Renderable;
  [REFERENCE]: Reference;
  [REVIVABLE]: Revivable;
  [SEQUENCABLE]: Sequencable;
  [POPUP]: Popup;
  [SOUL]: Soul;
  [SPAWNABLE]: Spawnable;
  [SPIKABLE]: Spikable;
  [SPRITE]: Sprite;
  [STATS]: UnitStats;
  [STRUCTURABLE]: Structurable;
  [SWIMMABLE]: Swimmable;
  [TEMPO]: Tempo;
  [TOOLTIP]: Tooltip;
  [TRACKABLE]: Trackable;
  [VIEWABLE]: Viewable;
  [WARPABLE]: Warpable;
};

// create a typed entity from component names
export type TypedEntity<C extends keyof Entity = never> = Pick<Entity, C> &
  Partial<Omit<Entity, C>>;

// allow creating entity factories for a given subset of components
const entityFactory = <T extends keyof Entity>(
  components: T[],
  { attachLevel } = { attachLevel: true }
) => {
  type EntityData = { [K in T]: Entity[K] };

  return (world: World, data: EntityData): EntityData => {
    const entity = world.createEntity();

    components.forEach((component) => {
      const componentData = data[component];
      world.addComponentToEntity(entity, component, componentData);
    });

    if (attachLevel && world.metadata.gameEntity[LEVEL].name) {
      world.addComponentToEntity(
        entity,
        world.metadata.gameEntity[LEVEL].name,
        {}
      );
    }

    return entity as EntityData;
  };
};

export const createAoe = entityFactory([EXERTABLE, POSITION]);

export const createArea = entityFactory([POSITION, TEMPO]);

export const createBarrier = entityFactory([
  COLLIDABLE,
  FOG,
  ORIENTABLE,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createBox = entityFactory([
  AFFECTABLE,
  ATTACKABLE,
  BELONGABLE,
  DISPLACABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  LAYER,
  MOVABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  SWIMMABLE,
  TOOLTIP,
  STATS,
]);

export const createBlock = entityFactory([
  CLICKABLE,
  COLLIDABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createBuilding = entityFactory([
  FOG,
  POSITION,
  RENDERABLE,
  STRUCTURABLE,
  VIEWABLE,
]);

export const createCactus = entityFactory([
  ATTACKABLE,
  AFFECTABLE,
  BELONGABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  SPIKABLE,
  STATS,
]);

export const createChest = entityFactory([
  ATTACKABLE,
  BELONGABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  LAYER,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STATS,
  TOOLTIP,
]);

export const createCompass = entityFactory([
  ITEM,
  ORIENTABLE,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TRACKABLE,
]);

export const createContainer = entityFactory([
  FOG,
  INVENTORY,
  LAYER,
  LOOTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  SWIMMABLE,
]);

export const createForging = entityFactory([
  COLLIDABLE,
  LAYER,
  FOG,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createCrafting = entityFactory([
  BURNABLE,
  COLLIDABLE,
  LAYER,
  FOG,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createDecoration = entityFactory([
  FOG,
  ORIENTABLE,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createDeposit = entityFactory([
  ATTACKABLE,
  BELONGABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STATS,
]);

export const createDoor = entityFactory([
  ENTERABLE,
  FOG,
  LIGHT,
  LOCKABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createDormant = entityFactory([
  ACTIONABLE,
  BEHAVIOUR,
  BELONGABLE,
  CLICKABLE,
  COLLIDABLE,
  DROPPABLE,
  EQUIPPABLE,
  FOG,
  INVENTORY,
  LAYER,
  MELEE,
  MOVABLE,
  NPC,
  ORIENTABLE,
  POSITION,
  RECHARGABLE,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STATS,
  SWIMMABLE,
  TOOLTIP,
]);

export const createEntry = entityFactory([
  FOG,
  LIGHT,
  LOCKABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createFacade = entityFactory([
  ENTERABLE,
  FOG,
  LAYER,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createFibre = entityFactory([
  ORIENTABLE,
  PARTICLE,
  RENDERABLE,
  SPRITE,
]);

export const createFire = entityFactory([
  BURNABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createFloat = entityFactory([
  FOG,
  POSITION,
  RENDERABLE,
  SPRITE,
  ORIENTABLE,
]);

export const createFloor = entityFactory([
  FOG,
  LAYER,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createFountain = entityFactory([
  COLLIDABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createFrame = entityFactory([RENDERABLE, REFERENCE]);

export const createFruit = entityFactory([
  BURNABLE,
  COLLIDABLE,
  FOG,
  INVENTORY,
  LOOTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createFurniture = entityFactory([
  COLLIDABLE,
  FOG,
  LAYER,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createGame = entityFactory([LEVEL, RENDERABLE, REFERENCE], {
  attachLevel: false,
});

export const createGate = entityFactory([
  BURNABLE,
  FOG,
  LOCKABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createGround = entityFactory([FOG, POSITION, RENDERABLE, SPRITE]);

export const createHalo = entityFactory([
  ACTIONABLE,
  BELONGABLE,
  EQUIPPABLE,
  INVENTORY,
  LAYER,
  LIGHT,
  MOVABLE,
  PLAYER,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SOUL,
  SPAWNABLE,
  SPRITE,
  VIEWABLE,
]);

export const createHero = entityFactory([
  ACTIONABLE,
  AFFECTABLE,
  ATTACKABLE,
  BELONGABLE,
  COLLECTABLE,
  DROPPABLE,
  EQUIPPABLE,
  FOG,
  INVENTORY,
  LAYER,
  LIGHT,
  MELEE,
  MOVABLE,
  ORIENTABLE,
  PLAYER,
  POSITION,
  PUSHABLE,
  RENDERABLE,
  SEQUENCABLE,
  SPAWNABLE,
  SPRITE,
  STATS,
  SWIMMABLE,
  TOOLTIP,
  VIEWABLE,
]);

export const createHighlight = entityFactory([
  FOCUSABLE,
  MOVABLE,
  ORIENTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TRACKABLE,
]);

export const createItem = entityFactory([ITEM, RENDERABLE, SPRITE]);

export const createLever = entityFactory([
  CLICKABLE,
  COLLIDABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createMine = entityFactory([
  COLLIDABLE,
  FOG,
  LIGHT,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createMob = entityFactory([
  ACTIONABLE,
  AFFECTABLE,
  ATTACKABLE,
  BEHAVIOUR,
  BELONGABLE,
  DROPPABLE,
  EQUIPPABLE,
  FOG,
  INVENTORY,
  LAYER,
  MELEE,
  MOVABLE,
  NPC,
  ORIENTABLE,
  POSITION,
  RECHARGABLE,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STATS,
  SWIMMABLE,
  TOOLTIP,
]);

export const createMountain = entityFactory([
  COLLIDABLE,
  FOG,
  LIGHT,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createNote = entityFactory([
  ITEM,
  POPUP,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createObject = entityFactory([
  ATTACKABLE,
  BELONGABLE,
  BURNABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  LAYER,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STATS,
]);

export const createOre = entityFactory([
  COLLIDABLE,
  FOG,
  INVENTORY,
  LIGHT,
  LOOTABLE,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createOrganic = entityFactory([
  BURNABLE,
  COLLIDABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createParticle = entityFactory([PARTICLE, RENDERABLE, SPRITE]);

export const createPlant = entityFactory([
  BURNABLE,
  COLLIDABLE,
  FOG,
  FRAGMENT,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createPlate = entityFactory([
  COLLIDABLE,
  ENTERABLE,
  FOG,
  LIGHT,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
]);

export const createPortal = entityFactory([
  COLLIDABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  TOOLTIP,
  WARPABLE,
]);

export const createProcessor = entityFactory([
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
]);

export const createResource = entityFactory([
  ATTACKABLE,
  BELONGABLE,
  BURNABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STATS,
]);

export const createRoot = entityFactory([
  BURNABLE,
  COLLIDABLE,
  FOG,
  FRAGMENT,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STRUCTURABLE,
]);

export const createShot = entityFactory([
  BELONGABLE,
  MOVABLE,
  ORIENTABLE,
  POSITION,
  PROJECTILE,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createSign = entityFactory([
  ATTACKABLE,
  BURNABLE,
  BELONGABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  LAYER,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STATS,
  TOOLTIP,
]);

export const createSnow = entityFactory([
  CLICKABLE,
  FOG,
  LIQUID,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createSpawner = entityFactory([
  BEHAVIOUR,
  BELONGABLE,
  FOG,
  LAYER,
  MOVABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createSpell = entityFactory([
  BELONGABLE,
  CASTABLE,
  ORIENTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createSplash = entityFactory([
  FOG,
  LIQUID,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createStructure = entityFactory([
  FOG,
  POSITION,
  RENDERABLE,
  STRUCTURABLE,
]);

export const createSword = entityFactory([
  ITEM,
  ORIENTABLE,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createTerrain = entityFactory([
  COLLIDABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createTile = entityFactory([
  FOG,
  POSITION,
  RENDERABLE,
  SPRITE,
  TEMPO,
]);

export const createTombstone = entityFactory([
  FOG,
  LAYER,
  POSITION,
  RENDERABLE,
  REVIVABLE,
  SEQUENCABLE,
  SPRITE,
  SWIMMABLE,
  TOOLTIP,
]);

export const createTransient = entityFactory([
  FOG,
  MOVABLE,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createTumbleweed = entityFactory([
  ATTACKABLE,
  AFFECTABLE,
  BEHAVIOUR,
  BELONGABLE,
  DROPPABLE,
  FOG,
  INVENTORY,
  MOVABLE,
  ORIENTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STATS,
]);

export const createViewpoint = entityFactory([POSITION, RENDERABLE, VIEWABLE]);

export const createVillager = entityFactory([
  ACTIONABLE,
  AFFECTABLE,
  ATTACKABLE,
  BEHAVIOUR,
  BELONGABLE,
  COLLECTABLE,
  DROPPABLE,
  EQUIPPABLE,
  FOG,
  INVENTORY,
  LAYER,
  MELEE,
  MOVABLE,
  NPC,
  ORIENTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  STATS,
  SWIMMABLE,
  TOOLTIP,
]);

export const createWall = entityFactory([
  COLLIDABLE,
  ENTERABLE,
  FOG,
  LAYER,
  LIGHT,
  POSITION,
  RENDERABLE,
  SPRITE,
]);

export const createWater = entityFactory([
  FOG,
  FREEZABLE,
  IMMERSIBLE,
  POSITION,
  RENDERABLE,
  SPRITE,
  TEMPO,
]);

export const createWeeds = entityFactory([
  BURNABLE,
  FOG,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
]);

export const createWorld = entityFactory([
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  VIEWABLE,
]);

export const createWrapper = entityFactory([
  FOG,
  INVENTORY,
  LAYER,
  LOOTABLE,
  POSITION,
  RENDERABLE,
  SEQUENCABLE,
  SPRITE,
  SWIMMABLE,
  TOOLTIP,
]);
