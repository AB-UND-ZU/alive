import React, { useState } from "react";
import { useSpring } from "@react-spring/three";
import { useDimensions } from "../Dimensions";
import { Position, POSITION } from "../../engine/components/position";
import { SPRITE, Sprite as SpriteType } from "../../engine/components/sprite";
import { Light, LIGHT } from "../../engine/components/light";
import { Movable, MOVABLE } from "../../engine/components/movable";
import { Renderable, RENDERABLE } from "../../engine/components/renderable";
import { Fog, FOG } from "../../engine/components/fog";
import { Swimmable, SWIMMABLE } from "../../engine/components/swimmable";
import * as colors from "../../game/assets/colors";
import Animated from "./Animated";
import CoveredLight from "./CoveredLight";
import { useWorld } from "../../bindings/hooks";
import { Player, PLAYER } from "../../engine/components/player";
import { Npc, NPC } from "../../engine/components/npc";
import { Attackable, ATTACKABLE } from "../../engine/components/attackable";
import {
  fogHeight,
  particleHeight,
  terrainHeight,
  unitHeight,
  wallHeight,
} from "./utils";
import { Melee, MELEE } from "../../engine/components/melee";
import { Equippable, EQUIPPABLE } from "../../engine/components/equippable";
import { Animatable, ANIMATABLE } from "../../engine/components/animatable";
import { Entity as EntityType } from "ecs";
import Stack, { Segment } from "./Stack";
import { Orientable, ORIENTABLE } from "../../engine/components/orientable";
import Box from "./Box";
import { getParticles } from "../../engine/systems/animate";
import { Particle, PARTICLE } from "../../engine/components/particle";
import Swimming from "./Swimming";
import Bar from "./Bar";
import { LayerProps } from "./Layer";
import { isLootable } from "../../engine/systems/collect";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
import { ITEM } from "../../engine/components/item";
import { Lootable, LOOTABLE } from "../../engine/components/lootable";

function Entity({
  entity,
  x,
  y,
}: {
  entity: {
    [ANIMATABLE]?: Animatable;
    [ATTACKABLE]?: Attackable;
    [EQUIPPABLE]?: Equippable;
    [FOG]?: Fog;
    [INVENTORY]?: Inventory;
    [POSITION]: Position;
    [SPRITE]: SpriteType;
    [LIGHT]?: Light;
    [LOOTABLE]?: Lootable;
    [MELEE]?: Melee;
    [MOVABLE]?: Movable;
    [NPC]?: Npc;
    [ORIENTABLE]?: Orientable;
    [PARTICLE]?: Particle;
    [PLAYER]?: Player;
    [RENDERABLE]: Renderable;
    [SWIMMABLE]?: Swimmable;
  };
  generation: number;
  x: number;
  y: number;
}) {
  const dimensions = useDimensions();
  const config = entity[MOVABLE]?.spring;
  const Container = config ? Animated : "group";

  const visibility = entity[FOG]?.visibility;
  const sprite = entity[SPRITE];
  const facing = entity[ORIENTABLE]?.facing;
  const isAir = entity[FOG]?.type === "air";
  const isTerrain = entity[FOG]?.type === "terrain";
  const isUnit = entity[FOG]?.type === "unit";
  const isVisible = visibility === "visible";
  const isHidden = visibility === "hidden";
  const isOpaque = !!entity[LIGHT] && entity[LIGHT].darkness > 0;
  const isBright = !!entity[LIGHT] && entity[LIGHT].brightness > 0;
  const isSwimming = !!entity[SWIMMABLE]?.swimming;
  const isAttackable = !!entity[ATTACKABLE];

  const isTransparent =
    (isHidden && !isAir) || (!isHidden && isAir) || (isUnit && !isVisible);

  const spring = useSpring({
    opacity: isTransparent ? 0 : 1,
    config: { duration: 200 },
    onRest: (result) => {
      setOpacity(result.value.opacity);
    },
  });

  const layerProps: LayerProps = {
    isTransparent,
    opacity: spring.opacity,
    animateOffset: false,
    receiveShadow: (isTerrain && !isOpaque) || isUnit,
  };

  const [opacity, setOpacity] = useState(layerProps.isTransparent ? 0 : 1);

  const { ecs } = useWorld();

  if (!ecs || (opacity === 0 && layerProps.isTransparent)) return null;

  const offsetZ = isOpaque
    ? wallHeight
    : isUnit
    ? unitHeight
    : isAir
    ? fogHeight
    : terrainHeight;

  const meleeEntity =
    entity[EQUIPPABLE]?.melee && ecs.getEntityById(entity[EQUIPPABLE].melee);

  // from back to front: armor, body, spell, melee, loot
  const orderedSegments: Segment[] = [];
  const orderedParticles: EntityType[] = [];

  // 2. body
  if (!isLootable(ecs, entity) || !entity[LOOTABLE]?.disposable) {
    orderedSegments.push({
      sprite,
      facing,
      offsetX: 0,
      offsetY: 0,
      layerProps,
    });
    orderedParticles.push(...getParticles(ecs, entity));
  }

  // 4. melee
  if (meleeEntity) {
    orderedSegments.push({
      sprite: meleeEntity[SPRITE],
      facing: meleeEntity[ORIENTABLE].facing,
      offsetX: 0,
      offsetY: 0,
      layerProps: {
        isTransparent: false,
        animateOffset: false,
        receiveShadow: layerProps.receiveShadow,
      },
    });
    orderedParticles.push(...getParticles(ecs, meleeEntity));
  }

  // 5. loot
  if (isLootable(ecs, entity) && (isVisible || !isTerrain || (isTerrain && isOpaque))) {
    for (const itemId of entity[INVENTORY]!.items) {
      const item = ecs.getEntityById(itemId);
      orderedSegments.push({
        sprite: item[SPRITE],
        facing: item[ORIENTABLE]?.facing,
        amount: item[ITEM].amount,
        offsetX: 0,
        offsetY: 0,
        layerProps,
      });
    }
  } 


  const particleSegments: Segment[] = orderedParticles.map((particle) => ({
    sprite: particle[SPRITE],
    facing: particle[ORIENTABLE]?.facing,
    offsetX: particle[PARTICLE].offsetX,
    offsetY: particle[PARTICLE].offsetY,
    layerProps: {
      isTransparent: false,
      animateTransparency: false,
      animateOffset: true,
      receiveShadow: false,
    },
  }));

  return (
    <Container position={[x * dimensions.aspectRatio, -y, 0]} spring={config}>
      {isOpaque && isVisible && (
        <Box height={wallHeight} castShadow>
          <meshBasicMaterial color={colors.black} />
        </Box>
      )}
      <Stack offsetZ={offsetZ} segments={orderedSegments} />
      <Stack offsetZ={particleHeight} segments={particleSegments} />

      {isBright && (
        <CoveredLight
          brightness={entity[LIGHT]!.brightness}
          shadow={dimensions.renderedDiagonal}
        />
      )}

      {!!entity[SWIMMABLE] && (
        <Swimming entity={entity} active={isSwimming} isVisible={isVisible} />
      )}

      {isAttackable && <Bar entity={entity} isVisible={isVisible} />}
    </Container>
  );
}

const MemoizedEntity = React.memo(
  Entity,
  (prevProps, nextProps) => prevProps.generation === nextProps.generation
);

export default MemoizedEntity;
