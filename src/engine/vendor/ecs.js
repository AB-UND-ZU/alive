/**
 * Performance fork of `ecs@0.21.0` (MIT, https://github.com/mreinstein/ecs).
 *
 * Same API and semantics (including filter array ordering), but:
 * - filter ids are split once instead of on every match
 * - adding/removing a component only revisits filters that mention it,
 *   instead of every filter in the world
 * - filter membership is tracked in a Set (O(1)) instead of Array#indexOf
 * - no devtools stats bookkeeping in the hot paths
 */

const removeAt = (array, index) => {
  array.splice(index, 1);
};

export function createWorld() {
  return {
    entityIds: new Map(),
    nextId: 1,
    entities: [],
    filters: {},
    // performance indexes
    filterParts: {}, // filterId -> [{ name, negated }]
    filterSets: {}, // filterId -> Set<Entity>
    componentFilters: {}, // componentName -> filterId[]
    systems: [],
    listeners: {
      added: new Set(),
      removed: new Set(),
      _added: new Set(),
      _removed: new Set(),
    },
    deferredRemovals: {
      entities: new Set(),
      components: [], // [ entity, componentName ] pairs
      componentKeys: new Map(), // entity -> Set<componentName>
    },
    stats: {
      entityCount: 0,
      systems: [],
      currentSystem: 0,
    },
  };
}

export function createEntity(world) {
  const entity = {};
  world.entities.push(entity);
  world.stats.entityCount++;
  world.entityIds.set(world.nextId, entity);
  world.entityIds.set(entity, world.nextId);
  world.nextId++;
  world.listeners._added.add(entity);
  return entity;
}

export function getEntityId(world, entity) {
  return world.entityIds.get(entity);
}

export function getEntityById(world, entityId) {
  return world.entityIds.get(entityId);
}

const matches = (parts, entity) => {
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.negated ? entity[part.name] : !entity[part.name]) return false;
  }
  return true;
};

const addToFilter = (world, filterId, entity) => {
  world.filters[filterId].push(entity);
  world.filterSets[filterId].add(entity);
};

const removeFromFilter = (world, filterId, entity) => {
  const filter = world.filters[filterId];
  removeAt(filter, filter.indexOf(entity));
  world.filterSets[filterId].delete(entity);
};

// re-evaluate only the filters that reference the changed component
const updateFilters = (world, entity, componentName) => {
  const filterIds = world.componentFilters[componentName];
  if (!filterIds) return;

  for (let i = 0; i < filterIds.length; i++) {
    const filterId = filterIds[i];
    const isMatch = matches(world.filterParts[filterId], entity);
    const isMember = world.filterSets[filterId].has(entity);

    if (isMember && !isMatch) removeFromFilter(world, filterId, entity);
    else if (!isMember && isMatch) addToFilter(world, filterId, entity);
  }
};

export function addComponentToEntity(world, entity, componentName, componentData = {}) {
  // ignore duplicate adds
  if (entity[componentName]) return;

  entity[componentName] = componentData;
  updateFilters(world, entity, componentName);
}

export function removeComponentFromEntity(world, entity, componentName, deferredRemoval = true) {
  if (!entity[componentName]) return;

  if (deferredRemoval) {
    const keys = world.deferredRemovals.componentKeys;
    let names = keys.get(entity);
    if (!names) {
      names = new Set();
      keys.set(entity, names);
    }
    if (!names.has(componentName)) {
      names.add(componentName);
      world.deferredRemovals.components.push([entity, componentName]);
    }
  } else {
    _removeComponent(world, entity, componentName);
  }
}

export function removeEntity(world, entity, deferredRemoval = true) {
  if (!world.entityIds.has(entity)) return;

  world.listeners._removed.add(entity);

  if (deferredRemoval) {
    if (!world.deferredRemovals.entities.has(entity)) {
      world.deferredRemovals.entities.add(entity);
      world.stats.entityCount--;
    }
  } else {
    _removeEntity(world, entity);
  }
}

const createFilter = (world, filterId) => {
  const parts = filterId.split(",").map((part) =>
    part.startsWith("!") ? { name: part.slice(1), negated: true } : { name: part, negated: false }
  );
  const filter = world.entities.filter((entity) => matches(parts, entity));
  world.filters[filterId] = filter;
  world.filterParts[filterId] = parts;
  world.filterSets[filterId] = new Set(filter);
  for (const part of parts) {
    (world.componentFilters[part.name] = world.componentFilters[part.name] || []).push(filterId);
  }
  return filter;
};

export function getEntities(world, componentNames, listenerType, listenerEntities) {
  const filterId = componentNames.join(",");
  const filter = world.filters[filterId] || createFilter(world, filterId);

  if (listenerType === "added" || listenerType === "removed") {
    if (listenerEntities) {
      const parts = world.filterParts[filterId];
      listenerEntities.count = 0;
      for (const entity of world.listeners[listenerType]) {
        if (matches(parts, entity)) {
          listenerEntities.entries[listenerEntities.count] = entity;
          listenerEntities.count++;
        }
      }
      return listenerEntities;
    }
  } else if (listenerType) {
    throw new Error(`Invalid listenerType '${listenerType}'. Should be 'removed' or 'added'.`);
  }

  return filter;
}

export function getEntity(world, componentNames) {
  return getEntities(world, componentNames)[0];
}

export function addSystem(world, fn) {
  const system = fn(world);
  const noop = function () {};
  for (const hook of ["onPreFixedUpdate", "onFixedUpdate", "onPostFixedUpdate", "onPreUpdate", "onUpdate", "onPostUpdate"]) {
    if (!system[hook]) system[hook] = noop;
  }
  world.systems.push(system);
}

const runHook = (hook) => (world, dt) => {
  for (let i = 0; i < world.systems.length; i++) {
    world.stats.currentSystem = i;
    world.systems[i][hook](dt);
  }
};

export const preFixedUpdate = runHook("onPreFixedUpdate");
export const fixedUpdate = runHook("onFixedUpdate");
export const postFixedUpdate = runHook("onPostFixedUpdate");
export const preUpdate = runHook("onPreUpdate");
export const update = runHook("onUpdate");
export const postUpdate = runHook("onPostUpdate");

function _removeComponent(world, entity, componentName) {
  delete entity[componentName];
  updateFilters(world, entity, componentName);
}

function _removeEntity(world, entity) {
  const entityIndex = world.entities.indexOf(entity);
  const entityId = world.entityIds.get(entity);
  if (entityId !== undefined) {
    world.entityIds.delete(entity);
    world.entityIds.delete(entityId);
  }
  if (entityIndex >= 0) removeAt(world.entities, entityIndex);

  world.deferredRemovals.entities.delete(entity);

  if (world.deferredRemovals.componentKeys.has(entity)) {
    world.deferredRemovals.componentKeys.delete(entity);
    const pending = world.deferredRemovals.components;
    for (let i = pending.length - 1; i >= 0; i--) {
      if (pending[i][0] === entity) removeAt(pending, i);
    }
  }

  for (const filterId in world.filterSets) {
    if (world.filterSets[filterId].has(entity)) removeFromFilter(world, filterId, entity);
  }
}

export function cleanup(world) {
  world.listeners.added.clear();
  world.listeners.removed.clear();

  for (const e of world.listeners._added) world.listeners.added.add(e);
  for (const e of world.listeners._removed) world.listeners.removed.add(e);

  world.listeners._added.clear();
  world.listeners._removed.clear();

  const pending = world.deferredRemovals.components;
  for (let i = 0; i < pending.length; i++) {
    const [entity, componentName] = pending[i];
    _removeComponent(world, entity, componentName);
  }
  pending.length = 0;
  world.deferredRemovals.componentKeys.clear();

  for (const entity of world.deferredRemovals.entities) _removeEntity(world, entity);
  world.deferredRemovals.entities.clear();
}

export default {
  createWorld,
  createEntity,
  getEntityId,
  getEntityById,
  addComponentToEntity,
  removeComponentFromEntity,
  getEntities,
  getEntity,
  removeEntity,
  addSystem,
  preFixedUpdate,
  fixedUpdate,
  postFixedUpdate,
  update,
  preUpdate,
  postUpdate,
  cleanup,
};
