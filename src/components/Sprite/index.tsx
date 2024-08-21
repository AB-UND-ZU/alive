import * as THREE from "three";
import { Text3D } from "@react-three/drei";
import { ThreeElements } from "@react-three/fiber";
import { useDimensions } from "../Dimensions";
import {
  Layer as LayerType,
  SPRITE,
  Sprite as SpriteType,
} from "../../engine/components/sprite";
import { LIGHT, Light } from "../../engine/components/light";
import * as colors from "../../game/assets/colors";
import { FOG, Fog } from "../../engine/components/fog";
import { fog as fogSprite } from "../../game/assets/sprites";
import { animated, useSpring } from "@react-spring/three";
import { useEffect, useRef, useState } from "react";
import { NPC, Npc } from "../../engine/components/npc";
import { Player, PLAYER } from "../../engine/components/player";
import { Swimmable, SWIMMABLE } from "../../engine/components/swimmable";
import { Entity } from "ecs";
import { MOVABLE } from "../../engine/components/movable";
import { aspectRatio } from "../Dimensions/sizing";

const textSize = 18 / 25;
const stack = 10;
const stackHeight = 1;

function Box({
  color,
  height,
  offset = 0,
  ...props
}: ThreeElements["mesh"] & {
  height: number;
  offset?: number;
  color: string | any;
}) {
  const dimensions = useDimensions();

  return (
    <mesh
      {...props}
      position={[0, 0, height / 2 + (offset * stackHeight) / stack]}
    >
      <boxGeometry args={[dimensions.aspectRatio, 1, height]} />
      <animated.meshBasicMaterial color={color} />
    </mesh>
  );
}

const swimmingColor = new THREE.Color(colors.navy).multiplyScalar(8);

function Swimming({
  active,
  entity,
  isVisible,
}: {
  active: boolean;
  entity: Entity;
  isVisible: boolean;
}) {
  const dimensions = useDimensions();
  const movement = entity[MOVABLE].movement;
  const activeRef = useRef(false);
  const [black, setBlack] = useState(isVisible);
  const [spring, api] = useSpring(
    () => ({
      opacity: isVisible ? 1 : 0,
      scaleY: active ? 1 : 0,
      translateX:
        movement === "left"
          ? dimensions.aspectRatio
          : movement === "right"
          ? -dimensions.aspectRatio
          : 0,
      translateY: active ? (aspectRatio - 1) / 2 : -0.5,
      config:
        !active && movement === "down"
          ? { duration: 0 }
          : entity[MOVABLE].spring,
      delay: active ? 100 : 0,
      onRest: (result) => {
        setBlack(result.value.opacity === 0);
      },
    }),
    [active, entity]
  );

  useEffect(() => {
    if (active && !activeRef.current) {
      api.set({
        translateX:
          movement === "left"
            ? -dimensions.aspectRatio
            : movement === "right"
            ? dimensions.aspectRatio
            : 0,
      });
      api.start({ translateX: 0 });
    }
    activeRef.current = active;
  }, [active, api, dimensions.aspectRatio, movement]);

  if (black) return null;

  return (
    <animated.mesh
      receiveShadow
      position-x={spring.translateX}
      position-y={spring.translateY}
      position-z={stackHeight * 2}
      scale-y={spring.scaleY}
    >
      <boxGeometry
        args={[dimensions.aspectRatio, dimensions.aspectRatio, 1 / stack]}
      />
      <animated.meshLambertMaterial
        color={swimmingColor}
        opacity={spring.opacity}
        transparent
      />
    </animated.mesh>
  );
}

function Layer({
  layer,
  offset,
  visibility,
  isAir,
  isOpaque,
  isUnit,
}: {
  layer: LayerType;
  offset: number;
  visibility?: Fog["visibility"];
  isAir: boolean;
  isOpaque: boolean;
  isUnit: boolean;
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
      opacity: 1,
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
        castShadow={isOpaque}
        color={spring.color}
        height={stackHeight / stack}
        offset={offset + (isOpaque ? stack : 0)}
      />
    );
  }

  return (
    <Text3D
      font="/fonts/MostPerfectDOSVGA.json"
      receiveShadow={receiveShadow}
      size={textSize}
      position={[
        -0.5 * dimensions.aspectRatio,
        -0.25,
        ((offset +
          (isUnit ? stack * 1 * 1 : 0) +
          (isOpaque ? stack : 0) +
          (isAir ? stack * 2 : 0)) *
          stackHeight) /
          stack,
      ]}
      height={stackHeight / stack}
    >
      {isAir ? (
        <meshBasicMaterial color={shadowColor.current} />
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
    [FOG]?: Fog;
    [LIGHT]?: Light;
    [NPC]?: Npc;
    [PLAYER]?: Player;
    [SPRITE]: SpriteType;
    [SWIMMABLE]?: Swimmable;
  };
}) {
  const visibility = entity[FOG]?.visibility;
  const isPlayer = !!entity[PLAYER];
  const isAir = entity[SPRITE] === fogSprite;
  const isVisible = visibility === "visible";
  const isOpaque = !!entity[LIGHT] && entity[LIGHT].darkness > 0;
  const isUnit = !!entity[NPC] || isPlayer;
  const isSwimming = !!entity[SWIMMABLE]?.swimming;

  return (
    <>
      {isOpaque && isVisible && (
        <Box color={colors.black} height={stackHeight} castShadow />
      )}
      {entity[SPRITE].layers.map((layer, index) => (
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

      {!!entity[SWIMMABLE] && (
        <Swimming
          entity={entity}
          active={isSwimming}
          isVisible={isPlayer || isVisible}
        />
      )}
    </>
  );
}
