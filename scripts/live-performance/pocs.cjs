const replace = (s, a, b) => {
  if (!s.includes(a)) throw Error("PoC anchor missing: " + a.slice(0, 65));
  return s.replace(a, b);
};
module.exports = (poc, file, s) => {
  if (poc === "fog-allocation" && file === "src/engine/systems/visibility.ts") {
    s = replace(
      s,
      `    const pendingColumn = (pendingChanges[normalizedX] =\n      pendingChanges[normalizedX] || {});\n    const pendingCell = (pendingColumn[normalizedY] =\n      pendingColumn[normalizedY] || {});\n    const pendingChange = pendingCell[entityId];`,
      `    const pendingCell = pendingChanges[normalizedX]?.[normalizedY];\n    const pendingChange = pendingCell?.[entityId];`
    );
    s = replace(
      s,
      `      pendingCell[entityId] = { from: fog.visibility, to: visibility };`,
      `      const pendingColumn = (pendingChanges[normalizedX] ||= {});\n      const pendingCell = (pendingColumn[normalizedY] ||= {});\n      pendingCell[entityId] = { from: fog.visibility, to: visibility };`
    );
  }
  if (poc === "action-cell" && file === "src/engine/systems/action.ts") {
    s = 'import { MOUNTABLE } from "../components/mountable";\n' + s;
    s = replace(
      s,
      `            const warpableEntity = getWarpable(world, targetPosition);\n            const lockableEntity = getLockable(world, targetPosition);\n            const adjacentPopup = getPopup(world, targetPosition);\n            const mountableEntity = getMountable(world, targetPosition);`,
      `            const adjacent = getCellEntities(world, targetPosition);\n            const warpableEntity = adjacent.find(entity => WARPABLE in entity);\n            const lockableEntity = adjacent.find(entity => LOCKABLE in entity);\n            const adjacentPopup = adjacent.find(entity => isPopupAvailable(world, entity));\n            const mountableEntity = adjacent.find(entity => MOUNTABLE in entity);`
    );
  }
  if (poc === "trace-arguments" && file === "src/game/math/tracing.ts") {
    const a = s.indexOf("const processCell = ({"),
      b = s.indexOf("  const delta = {", a);
    if (a < 0 || b < 0) throw Error("No processCell");
    s =
      s.slice(0, a) +
      `const processCell = (world: World, level: Level, visibleCells: Point[], radius: number, direction: number, normal: number, iteration: Iteration, intervals: Interval[], cell: Point) => {\n` +
      s.slice(b);
    s = s.replace("  const args = { world, level, visibleCells, radius };", "");
    s = s.replace(
      /processCell\(\{\s*\.\.\.args,\s*direction,\s*normal: ([^,]+),\s*iteration,\s*intervals: visibleIntervals,\s*cell: point,\s*\}\)/g,
      "processCell(world, level, visibleCells, radius, direction, $1, iteration, visibleIntervals, point)"
    );
    s = s.replace(
      /processCell\(\{\s*\.\.\.args,\s*direction,\s*normal,\s*iteration,\s*intervals: visibleIntervals,\s*cell: point,\s*\}\)/g,
      "processCell(world, level, visibleCells, radius, direction, normal, iteration, visibleIntervals, point)"
    );
  }
  if (poc === "trace-angles" && file === "src/game/math/tracing.ts") {
    s = s.replace(
      "const cellToIntervals = (",
      "const calculateCellIntervals = ("
    );
    const at = s.indexOf("export const degreesToOrientations");
    s =
      s.slice(0, at) +
      `const angleCache = new Map<string, Interval[]>();\nconst cellToIntervals = (iteration: Iteration, point: Point, orientation?: Orientation): Interval[] => {\nconst key = iteration.orientation+":"+point.x+":"+point.y+":"+orientation;\nlet result=angleCache.get(key);\nif(!result){result=calculateCellIntervals(iteration,point,orientation);if(angleCache.size<16384)angleCache.set(key,result);}\nreturn result;\n};\n` +
      s.slice(at);
  }
  if (poc === "world-matrices") {
    if (file === "src/components/Entity/Instances.tsx")
      s = s
        .replace(
          "scene.add(root);",
          "scene.add(root);\n    scene.matrixAutoUpdate = false;"
        )
        .replace(
          "scene.remove(root);",
          "scene.remove(root);\n      scene.matrixAutoUpdate = true;"
        );
    if (
      [
        "src/components/Systems/index.tsx",
        "src/components/Entity/Animated.tsx",
      ].includes(file)
    )
      s =
        'import { updateLocalMatrix } from "' +
        (file.includes("/Systems/")
          ? "../Entity/matrixUpdates"
          : "./matrixUpdates") +
        '";\n' +
        s;
    if (
      [
        "src/components/Systems/index.tsx",
        "src/components/Entity/Animated.tsx",
        "src/components/Entity/Sprite.tsx",
      ].includes(file)
    )
      s = s.replaceAll(
        "<animated.group",
        "<animated.group matrixAutoUpdate={false} onUpdate={updateLocalMatrix}"
      );
  }
  if (poc === "fog-grid" && file === "src/engine/systems/visibility.ts") {
    s = replace(
      s,
      "    const pendingChanges: PendingChanges = {};",
      '    const pendingChanges: PendingChanges = {};\n    const cells: Record<number, Record<number, Fog["visibility"]>> = {};\n    const markCell = (x: number, y: number, visibility: Fog["visibility"]) => {\n      const size = world.metadata.gameEntity[LEVEL].size;\n      (cells[normalize(x, size)] ||= {})[normalize(y, size)] = visibility;\n    };'
    );
    s = s.replace(
      /markVisibility\(\s*world,\s*pendingChanges,\s*/g,
      "markCell("
    );
    s = replace(
      s,
      "    // apply changes",
      "    for (const x in cells) {\n      for (const y in cells[x]) markVisibility(world, pendingChanges, Number(x), Number(y), cells[x][y]);\n    }\n\n    // apply changes"
    );
  }
  if (poc === "drop-decayed" && file === "src/engine/systems/drop.ts") {
    s = replace(
      s,
      "    for (const entity of world.getEntities([DROPPABLE, RENDERABLE, POSITION])) {\n      const rootEntity",
      "    for (const entity of world.getEntities([DROPPABLE, RENDERABLE, POSITION])) {\n      if (!isDecayed(world, entity)) continue;\n      const rootEntity"
    );
  }
  if (poc === "audio-worker" && file === "src/game/sound/index.ts") {
    s = replace(
      s,
      "  setTimeout(next);\n};",
      `  try {
    const worker = new Worker('/audio-worker/audio.worker.js');
    worker.onmessage = ({data}) => {
      if(!sounds.has(data.key)) sounds.set(data.key, {sound:createSoundBuffer(data.samples,data.sampleRate),gain:data.gain});
      sendNext();
    };
    worker.onerror=()=>{worker.terminate();setTimeout(next);};
    const sendNext=()=>{const entry=pending.shift();if(!entry){worker.terminate();return;}if(getGain(entry)>0)worker.postMessage(entry);else sendNext();};
    sendNext();
  } catch {setTimeout(next);}
};`
    );
  }
  if (
    poc === "relative-shadows" &&
    file === "src/components/Entity/ShadowCache.tsx"
  ) {
    s = replace(
      s,
      "    push(lights.current.length);",
      "    const origin = lights.current[0]?.matrixWorld.elements;\n    const x = origin?.[12] || 0, y = origin?.[13] || 0, z = origin?.[14] || 0;\n    push(lights.current.length);"
    );
    s = s
      .replaceAll("push(e[12]);", "push(e[12] - x);")
      .replaceAll("push(e[13]);", "push(e[13] - y);")
      .replaceAll("push(e[14]);", "push(e[14] - z);");
    s = s.replace(
      "if (next[index] !== value)",
      "if (next[index] === undefined || Math.abs(next[index] - value) > 1e-10)"
    );
    s = s.replace(
      "      const shadow = light.shadow as THREE.LightShadow;",
      "      const shadow = light.shadow as THREE.LightShadow;\n      shadow.updateMatrices(light);"
    );
  }
  if (poc === "action-scan" && file === "src/engine/systems/action.ts") {
    s = 'import { MOUNTABLE } from "../components/mountable";\n' + s;
    s = s.replace(
      "import { getCellEntities }",
      "import { getCell, getCellEntities }"
    );
    s = replace(
      s,
      `            const warpableEntity = getWarpable(world, targetPosition);
            const lockableEntity = getLockable(world, targetPosition);
            const adjacentPopup = getPopup(world, targetPosition);
            const mountableEntity = getMountable(world, targetPosition);`,
      `            let warpableEntity: Entity | undefined;
            let lockableEntity: Entity | undefined;
            let adjacentPopup: Entity | undefined;
            let mountableEntity: Entity | undefined;
            const cell = getCell(world, targetPosition);
            for (const id in cell) {
              const target = cell[id];
              if (!warpableEntity && WARPABLE in target) warpableEntity = target;
              if (!lockableEntity && LOCKABLE in target) lockableEntity = target;
              if (!adjacentPopup && isPopupAvailable(world, target)) adjacentPopup = target;
              if (!mountableEntity && MOUNTABLE in target) mountableEntity = target;
            }`
    );
  }
  if (poc === "box-faces" && file === "src/components/Entity/Instances.tsx") {
    s = replace(
      s,
      "  if (!batch) {",
      '  if (!batch) {\n    if (geometry.type === "BoxGeometry") { geometry = geometry.clone(); geometry.setDrawRange(24, 6); }'
    );
  }
  return s;
};
