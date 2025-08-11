import React, { useState } from "react";
import { useSpring } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { SPRITE } from "../../engine/components/sprite";
import { LIGHT } from "../../engine/components/light";
import { MOVABLE } from "../../engine/components/movable";
import { FOG } from "../../engine/components/fog";
import { SWIMMABLE } from "../../engine/components/swimmable";
import * as colors from "../../game/assets/colors";
import Animated from "./Animated";
import CoveredLight from "./CoveredLight";
import { useWorld } from "../../bindings/hooks";
import {
  getSegments,
  lootHeight,
  oreHeight,
  shadowFactor,
  wallHeight,
} from "./utils";
import Stack, { Segment } from "./Stack";
import { ORIENTABLE } from "../../engine/components/orientable";
import Box from "./Box";
import { PARTICLE } from "../../engine/components/particle";
import Swimming from "./Swimming";
import Bar from "./Bar";
import { LayerProps } from "./Layer";
import { INVENTORY } from "../../engine/components/inventory";
import { isCollecting, isLootable } from "../../engine/systems/collect";
import { ITEM } from "../../engine/components/item";
import { TypedEntity } from "../../engine/entities";
import { getParticles } from "../../engine/systems/sequence";
import Dots from "./Dots";
import { STATS } from "../../engine/components/stats";
import { getOpaqueOrientation } from "../../game/math/tracing";
import { FOCUSABLE } from "../../engine/components/focusable";
import { ATTACKABLE } from "../../engine/components/attackable";
import { PROJECTILE } from "../../engine/components/projectile";

function Entity({
  entity,
  x,
  y,
  inRadius,
  inside,
  outside,
}: {
  entity: TypedEntity<"POSITION" | "SPRITE" | "RENDERABLE">;
  generation: number;
  x: number;
  y: number;
  inRadius: boolean;
  inside: boolean;
  outside: boolean;
}) {
  const dimensions = useDimensions();
  const { ecs, paused } = useWorld();
  const config = entity[MOVABLE]?.spring;
  const Container = config ? Animated : "group";

  const visibility = entity[FOG]?.visibility;
  const isAir = entity[FOG]?.type === "air";
  const isFloat = entity[FOG]?.type === "float";
  const isUnit = entity[FOG]?.type === "unit" || !!entity[PROJECTILE];
  const isFocusable = !!entity[FOCUSABLE];
  const isFixed = !!entity[FOG]?.fixed && visibility === "visible";
  const isVisible = visibility === "visible" || !!entity[PROJECTILE];
  const isHidden = visibility === "hidden";
  const isOpaque = !!entity[LIGHT] && entity[LIGHT].darkness > 0;
  const opaqueOrientation =
    isOpaque && ecs ? getOpaqueOrientation(ecs, entity) : undefined;
  const isBright = !!entity[LIGHT] && entity[LIGHT].brightness > 0 && !inside;
  const isSwimming = !!entity[SWIMMABLE]?.swimming;
  const hasStats = !!entity[STATS] && entity[ATTACKABLE];

  const isTransparent =
    (isHidden && !isAir) ||
    (!isHidden && isAir) ||
    (isUnit && !isVisible) ||
    (outside && !isFixed);

  const hasLoot = ecs && (isLootable(ecs, entity) || isCollecting(ecs, entity));
  const isLootTransparent = !hasLoot || (isOpaque ? !inRadius : !isVisible);

  const spring = useSpring({
    opacity: isTransparent ? 0 : 1,
    lootOpacity: isLootTransparent ? 0 : 1,
    config: { duration: 200 },
    onRest: (result) => {
      setOpacity(result.value.opacity);
    },
    pause: paused,
  });

  const layerProps: LayerProps = {
    isTransparent,
    opacity: spring.opacity,
    receiveShadow: !isAir && !isOpaque && !isFloat && !inside,
    colorFactor: outside ? shadowFactor : undefined,
  };

  const [opacity, setOpacity] = useState(layerProps.isTransparent ? 0 : 1);

  if (
    !ecs ||
    (opacity === 0 && layerProps.isTransparent && !isUnit && !isFocusable)
  )
    return null;

  const orderedSegments = getSegments(ecs, entity, layerProps, inside);

  // particles are rendered in their own stack
  const particleSegments: Segment[] = getParticles(ecs, entity).map(
    (particle, index) => ({
      id: ecs.getEntityId(particle) || index,
      sprite: particle[SPRITE],
      facing: particle[ORIENTABLE]?.facing,
      offsetX: particle[PARTICLE].offsetX,
      offsetY: particle[PARTICLE].offsetY,
      offsetZ: particle[PARTICLE].offsetZ,
      amount: particle[PARTICLE].amount,
      layerProps: {
        isTransparent: false,
        animatedOrigin: particle[PARTICLE].animatedOrigin,
        receiveShadow: false,
        duration: particle[PARTICLE].duration,
      },
    })
  );

  // add loot between entity and particles
  const lootSegments: Segment[] = [];
  if (hasLoot) {
    for (const itemId of entity[INVENTORY]!.items) {
      const item = ecs.getEntityByIdAndComponents(itemId, [SPRITE, ITEM]);

      // skip if item has just been collected
      if (!item) continue;

      lootSegments.push({
        id: itemId,
        sprite: item[SPRITE],
        facing: item[ORIENTABLE]?.facing,
        amount: item[ITEM].amount,
        offsetX: 0,
        offsetY: 0,
        offsetZ: isOpaque ? oreHeight : lootHeight,
        layerProps: {
          isTransparent,
          opacity: spring.lootOpacity,
          receiveShadow: !isOpaque && inRadius && !inside,
          colorFactor: outside ? shadowFactor : undefined,
        },
      });
    }
  }

  const lootSegment = lootSegments[0];
  const isEquipment =
    !!lootSegment &&
    !!ecs.assertByIdAndComponents(lootSegment.id, [ITEM])[ITEM].equipment;

  return (
    <Container
      position={[x * dimensions.aspectRatio, -y, 0]}
      spring={config}
      bumpOrientation={entity[ORIENTABLE]?.facing}
      bumpGeneration={entity[MOVABLE]?.bumpGeneration}
    >
      {isOpaque && isVisible && (
        <Box height={wallHeight} castShadow orientation={opaqueOrientation}>
          <meshBasicMaterial color={colors.black} />
        </Box>
      )}
      {orderedSegments.length > 0 && <Stack segments={orderedSegments} />}
      {lootSegments.length > 0 && <Stack segments={lootSegments} />}
      {particleSegments.length > 0 && <Stack segments={particleSegments} />}

      {isBright && (
        <CoveredLight
          brightness={entity[LIGHT]!.brightness}
          shadow={dimensions.renderedDiagonal}
        />
      )}

      {!!entity[SWIMMABLE] && (
        <Swimming
          entity={entity}
          active={isSwimming}
          isVisible={!isTransparent}
        />
      )}

      {hasStats && (
        <Bar world={ecs} counter="hp" entity={entity} isVisible={isVisible} />
      )}

      {lootSegment && !isEquipment && (
        <Dots segment={lootSegment} entity={entity} isVisible={isVisible} />
      )}
    </Container>
  );
}

const MemoizedEntity = React.memo(
  Entity,
  (prevProps, nextProps) =>
    prevProps.generation === nextProps.generation &&
    prevProps.inRadius === nextProps.inRadius &&
    prevProps.inside === nextProps.inside &&
    prevProps.outside === nextProps.outside
);

export default MemoizedEntity;
