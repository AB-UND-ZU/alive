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

  const layerProps: LayerProps = {
    isTransparent:
      (isHidden && !isAir) || (!isHidden && isAir) || (isUnit && !isVisible),
    animateTransparency: isUnit || isTerrain,
    animateOffset: false,
    receiveShadow: (isTerrain && !isOpaque) || isUnit,
  };

  const [transparent, setTransparent] = useState(
    layerProps.isTransparent ? 0 : 1
  );

  useSpring({
    transparent: layerProps.isTransparent ? 0 : 1,
    config: { duration: isAir ? 0 : isTerrain ? 400 : 150 },
    delay: isTerrain ? 150 : 0,
    onRest: (result) => {
      setTransparent(result.value.transparent);
    },
  });

  const { ecs } = useWorld();

  if (!ecs || (transparent === 0 && layerProps.isTransparent)) return null;

  const offsetZ = isOpaque
    ? wallHeight
    : isUnit
    ? unitHeight
    : isAir
    ? fogHeight
    : terrainHeight;

  const meleeEntity =
    entity[EQUIPPABLE]?.melee && ecs.getEntityById(entity[EQUIPPABLE].melee);

  // from back to front: armor, body/loot, spell, melee
  const orderedSegments: Segment[] = [];
  const orderedParticles: EntityType[] = [];

  // 2. body/loot
  if (isLootable(ecs, entity) && entity[INVENTORY]) {
    for (const itemId of entity[INVENTORY].items) {
      const item = ecs.getEntityById(itemId);
      orderedSegments.push({
        sprite: item[SPRITE],
        facing: item[ORIENTABLE]?.facing,
        offsetX: 0,
        offsetY: 0,
        layerProps,
      });
    }
  } else {
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
        animateTransparency: false,
        animateOffset: false,
        receiveShadow: layerProps.receiveShadow,
      },
    });
    orderedParticles.push(...getParticles(ecs, meleeEntity));
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
