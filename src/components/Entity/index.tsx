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
import { getSegments, wallHeight } from "./utils";
import { Melee, MELEE } from "../../engine/components/melee";
import { Equippable, EQUIPPABLE } from "../../engine/components/equippable";
import { Animatable, ANIMATABLE } from "../../engine/components/animatable";
import Stack, { Segment } from "./Stack";
import { Orientable, ORIENTABLE } from "../../engine/components/orientable";
import Box from "./Box";
import { getParticles } from "../../engine/systems/animate";
import { Particle, PARTICLE } from "../../engine/components/particle";
import Swimming from "./Swimming";
import Bar from "./Bar";
import { LayerProps } from "./Layer";
import { Inventory, INVENTORY } from "../../engine/components/inventory";
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
  const isAir = entity[FOG]?.type === "air";
  const isFloat = entity[FOG]?.type === "float";
  const isUnit = entity[FOG]?.type === "unit";
  const isVisible = visibility === "visible";
  const isHidden = visibility === "hidden";
  const isOpaque = !!entity[LIGHT] && entity[LIGHT].darkness > 0;
  const opaqueOrientation = isOpaque ? entity[LIGHT]?.orientation : undefined;
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
    receiveShadow: !isAir && !isOpaque && !isFloat,
  };

  const [opacity, setOpacity] = useState(layerProps.isTransparent ? 0 : 1);

  const { ecs } = useWorld();

  if (!ecs || (opacity === 0 && layerProps.isTransparent)) return null;

  const orderedSegments = getSegments(ecs, entity, layerProps);

  // particles are rendered in their own stack
  const particleSegments: Segment[] = getParticles(ecs, entity).map(
    (particle) => ({
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
      },
    })
  );

  return (
    <Container position={[x * dimensions.aspectRatio, -y, 0]} spring={config}>
      {isOpaque && isVisible && (
        <Box height={wallHeight} castShadow orientation={opaqueOrientation}>
          <meshBasicMaterial color={colors.black} />
        </Box>
      )}
      <Stack segments={orderedSegments} />
      <Stack segments={particleSegments} />

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
