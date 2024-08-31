import * as THREE from "three";
import { Text3D } from "@react-three/drei";
import { useDimensions } from "../Dimensions";
import {
  Layer as LayerType,
  SPRITE,
  Sprite as SpriteType,
} from "../../engine/components/sprite";
import { Attackable, ATTACKABLE } from "../../engine/components/attackable";
import { LIGHT, Light } from "../../engine/components/light";
import * as colors from "../../game/assets/colors";
import { FOG, Fog } from "../../engine/components/fog";
import { fog as fogSprite } from "../../game/assets/sprites";
import { animated, useSpring } from "@react-spring/three";
import { useRef, useState } from "react";
import { NPC, Npc } from "../../engine/components/npc";
import { Player, PLAYER } from "../../engine/components/player";
import { Swimmable, SWIMMABLE } from "../../engine/components/swimmable";
import { Movable, MOVABLE } from "../../engine/components/movable";
import { fogHeight, particleHeight, unitHeight, wallHeight } from "../Camera";
import { getFacingLayers, stack, stackHeight, textSize } from "./utils";
import Swimming from "./Swimming";
import Box from "./Box";
import Bar from "./Bar";
import { Particle, PARTICLE } from "../../engine/components/particle";
import { Melee, MELEE } from "../../engine/components/melee";
import { useWorld } from "../../bindings/hooks";
import { Orientable, ORIENTABLE } from "../../engine/components/orientable";
import { Animatable, ANIMATABLE } from "../../engine/components/animatable";
import { Entity } from "ecs";
import { Equippable, EQUIPPABLE } from "../../engine/components/equippable";

function Layer({
  layer,
  offset,
  visibility,
  isAir,
  isOpaque,
  isUnit,
  particle,
}: {
  layer: LayerType;
  offset: number;
  visibility?: Fog["visibility"];
  isAir: boolean;
  isOpaque: boolean;
  isUnit: boolean;
  particle?: Particle;
}) {
  const dimensions = useDimensions();

  const isFog = visibility === "fog";
  const isHidden =
    !!visibility && (visibility === "hidden" || (isUnit && isFog));

  const shadowColor = useRef(
    `#${new THREE.Color(layer.color).multiplyScalar(0.125).getHexString()}`
  );
  let color = layer.color;

  if (isAir && isHidden) color = shadowColor.current;
  if (isAir && !isHidden) color = "#000000";
  if (!isAir && isHidden) color = "#000000";

  const transparent = color === "#000000";

  const spring = useSpring({
    from: {
      color: "#000000",
      opacity: transparent ? 0 : 1,
    },
    to: {
      color,
      opacity: transparent ? 0 : 1,
    },
    config: { duration: isAir || isUnit ? 150 : 400 },
    delay: isAir || isUnit ? 0 : 50,
    onRest: (result) => {
      setBlack(result.value.color === "#000000");
    },
  });

  const [black, setBlack] = useState(spring.color.get() === "rgba(0, 0, 0, 1)");

  if (!isAir && isHidden && !(isUnit && isFog)) return null;
  if (isAir && black) return null;

  const receiveShadow = !isAir && !isOpaque && !isHidden && !isUnit;

  if (layer.char === "█") {
    return (
      <Box
        receiveShadow={receiveShadow}
        color={spring.color}
        height={stackHeight / stack}
        offset={offset + (isOpaque ? stack * wallHeight : 0)}
      />
    );
  }

  return (
    <Text3D
      font="/fonts/MostPerfectDOSVGA.json"
      receiveShadow={receiveShadow}
      size={textSize}
      position={[
        ((particle ? particle.offsetX : 0) - 0.5) * dimensions.aspectRatio,
        -0.25 - (particle ? particle.offsetY : 0),
        ((offset +
          (isUnit && !isOpaque ? stack * unitHeight : 0) +
          (particle ? stack * particleHeight : 0) +
          (isOpaque ? stack * wallHeight : 0) +
          (isAir ? stack * fogHeight : 0)) *
          stackHeight) /
          stack,
      ]}
      height={stackHeight / stack}
    >
      {isOpaque ? (
        <animated.meshBasicMaterial color={spring.color} />
      ) : isAir ? (
        <meshBasicMaterial color={shadowColor.current} />
      ) : particle ? (
        <meshBasicMaterial color={color} />
      ) : isUnit ? (
        <animated.meshBasicMaterial
          color={layer.color}
          transparent={black || transparent}
          opacity={spring.opacity}
        />
      ) : (
        <animated.meshLambertMaterial color={spring.color} />
      )}
      {layer.char}
    </Text3D>
  );
}

export default function Sprite({
  entity,
}: {
  entity: {
    [ATTACKABLE]?: Attackable;
    [ANIMATABLE]?: Animatable;
    [FOG]?: Fog;
    [EQUIPPABLE]?: Equippable;
    [LIGHT]?: Light;
    [MELEE]?: Melee;
    [MOVABLE]?: Movable;
    [NPC]?: Npc;
    [ORIENTABLE]?: Orientable;
    [PARTICLE]?: Particle;
    [PLAYER]?: Player;
    [SPRITE]: SpriteType;
    [SWIMMABLE]?: Swimmable;
  };
}) {
  const { ecs } = useWorld();

  const visibility = entity[FOG]?.visibility;
  const isPlayer = !!entity[PLAYER];
  const sprite = entity[SPRITE];
  const isAir = sprite === fogSprite;
  const isVisible = visibility === "visible";
  const isOpaque = !!entity[LIGHT] && entity[LIGHT].darkness > 0;
  const isUnit = !!entity[NPC] || isPlayer;
  const isSwimming = !!entity[SWIMMABLE]?.swimming;
  const isAttackable = !!entity[ATTACKABLE];

  const spriteLayers = ecs ? getFacingLayers(ecs, entity) : [];
  const meleeItem =
    entity[MELEE] &&
    entity[EQUIPPABLE] &&
    ecs &&
    ecs.getEntityById(entity[EQUIPPABLE].melee);
  const melee = meleeItem ? getFacingLayers(ecs, meleeItem) : [];
  const layers = spriteLayers.concat(melee);

  const particles = entity[ANIMATABLE]
    ? Object.values(entity[ANIMATABLE].states)
        .concat(meleeItem ? Object.values(meleeItem[ANIMATABLE].states) : [])
        .reduce<Entity[]>(
          (all, animation) =>
            all.concat(
              Object.values(animation.particles).map((entityId) =>
                ecs?.getEntityById(entityId)
              )
            ),
          []
        )
    : [];
  const particleLayers = particles.reduce<[Particle, LayerType][]>(
    (layers, particle) =>
      layers.concat(
        particle[SPRITE].layers.map((layer: LayerType) => [
          particle[PARTICLE],
          layer,
        ])
      ),
    []
  );

  return (
    <>
      {isOpaque && isVisible && (
        <Box color={colors.black} height={wallHeight} castShadow />
      )}
      {layers.map((layer, index) => (
        <Layer
          isAir={isAir}
          isOpaque={isOpaque}
          isUnit={isUnit}
          visibility={visibility}
          layer={layer}
          key={index}
          offset={index}
        />
      ))}

      {particleLayers.map(([particle, layer], index) => (
        <Layer
          isAir={isAir}
          isOpaque={isOpaque}
          isUnit={isUnit}
          particle={particle}
          visibility={visibility}
          layer={layer}
          key={index}
          offset={index}
        />
      ))}

      {!!entity[SWIMMABLE] && (
        <Swimming
          entity={entity}
          active={isSwimming}
          isVisible={isPlayer || isVisible}
        />
      )}

      {isAttackable && (
        <Bar entity={entity} isVisible={isPlayer || isVisible} />
      )}
    </>
  );
}
