# Entity Factories

`createDialog` supplies an invisible world entity for native editor popups; register its position before opening it.

Typed factories attach the required component data and, normally, the current level tag. Factory names describe common entity shapes; [world creation](../bindings/creation.md) supplies their gameplay data.

| Contract            | Behavior                                                         |
| ------------------- | ---------------------------------------------------------------- |
| Required components | Every component listed by the factory needs a value in its input |
| Component data      | Attached as supplied; mutable data must belong to this entity    |
| Level tag           | Added automatically unless the factory opts out                  |
| Return value        | Entity data with its required components known to TypeScript     |

```ts src/engine/entities.ts
const counter = createCounter(world, {
  RENDERABLE: { generation: 0 },
});
```

The game’s `Entity` type maps component names to their data. Use `TypedEntity` for an entity of unknown shape and list the components a function needs, for example `TypedEntity<"POSITION" | "SPRITE">`. A factory guarantees its declared components. A world query guarantees the components in its query. All other components remain optional.

Use `hasComponent(entity, key)` when absence is a normal case. For an owner selected dynamically, `requireComponent(entity, key)` returns that component or throws at the point where it is needed. Use the world’s component queries and assertions when looking up an entity that needs several components. [World](ecs.md)

`getEntityId` returns a number that carries the known entity type through TypeScript. For example, sequence particle references carry their sprite, particle and rendering components. The numeric save format stays the same. A lookup can still return `undefined` after removal, and a plain number from an external source carries no component guarantees.

Factories do not register positioned entities immediately. [Map](systems/map.md) handles new registrations at update cleanup; [preloading](ecs.md) runs that registration before initial rendering.
<!-- source-types -->

## Entity

```ts src/engine/entities.ts
export type Entity = Record<LevelName, {}> & {
  [ACTIONABLE]: Actionable;
  [AFFECTABLE]: Affectable;
  [ATTACKABLE]: Attackable;
  [BAITABLE]: Baitable;
  [BEHAVIOUR]: Behaviour;
  [BELONGABLE]: Belongable;
  [BLOCKABLE]: Blockable;
  [BREWABLE]: Brewable;
  [BUILDABLE]: Buildable;
  [BUMPABLE]: Bumpable;
  [BURNABLE]: Burnable;
  [CASTABLE]: Castable;
  [CLICKABLE]: Clickable;
  [COLLECTABLE]: Collectable;
  [COLLIDABLE]: Collidable;
  [CONDITIONABLE]: Conditionable;
  [COVERABLE]: Coverable;
  [DISPLACABLE]: Displacable;
  [DROPPABLE]: Droppable;
  [ENTERABLE]: Enterable;
  [EQUIPPABLE]: Equippable;
  [EXERTABLE]: Exertable;
  [FARMABLE]: Farmable;
  [FISHABLE]: Fishable;
  [FOCUSABLE]: Focusable;
  [FOG]: Fog;
  [FORGABLE]: Forgable;
  [FRAGMENT]: Fragment;
  [FREEZABLE]: Freezable;
  [HARVESTABLE]: Harvestable;
  [HOMING]: Homing;
  [HOOKABLE]: Hookable;
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
  [MOUNTABLE]: Mountable;
  [MOVABLE]: Movable;
  [NPC]: Npc;
  [ORIENTABLE]: Orientable;
  [PARTICLE]: Particle;
  [PLAYER]: Player;
  [POI]: Poi;
  [POPUP]: Popup;
  [POSITION]: Position;
  [PROJECTILE]: Projectile;
  [PUSHABLE]: Pushable;
  [RECHARGABLE]: Rechargable;
  [REFERENCE]: Reference;
  [REFILLABLE]: Refillable;
  [REMAINABLE]: Remainable;
  [RENDERABLE]: Renderable;
  [RESTORABLE]: Restorable;
  [REVIVABLE]: Revivable;
  [SEQUENCABLE]: Sequencable;
  [SHOOTABLE]: Shootable;
  [SOUL]: Soul;
  [SPAWNABLE]: Spawnable;
  [SPIKABLE]: Spikable;
  [SPRITE]: SpriteRef;
  [STATS]: Stats;
  [STRUCTURABLE]: Structurable;
  [SWIMMABLE]: Swimmable;
  [TEMPO]: Tempo;
  [TOOLTIP]: Tooltip;
  [TRACKABLE]: Trackable;
  [VANISHABLE]: Vanishable;
  [VIEWABLE]: Viewable;
  [WARPABLE]: Warpable;
};
```

## TypedEntity

```ts src/engine/entities.ts
export type TypedEntity<C extends keyof Entity = never> = Pick<Entity, C> &
  Partial<Entity>;
```

## EntityId

```ts src/engine/entities.ts
export type EntityId<E extends TypedEntity> = number & { readonly [referencedEntity]: E };
```

## ReferencedEntity

```ts src/engine/entities.ts
export type ReferencedEntity<I extends number> = I extends EntityId<infer E> ? E : TypedEntity;
```
