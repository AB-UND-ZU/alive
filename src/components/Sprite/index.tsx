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
import { useRef, useState } from "react";
import { NPC, Npc } from "../../engine/components/npc";

const textSize = 18 / 25;
const stack = 1000;
const height = 2;

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
    <mesh castShadow {...props} position={[0, 0, height / 2 + offset]}>
      <boxGeometry args={[dimensions.aspectRatio, 1, height]} />
      <animated.meshBasicMaterial color={color} />
    </mesh>
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
  if (isAir && !isHidden) color = "black";
  if (!isAir && isHidden) color = "black";

  const spring = useSpring({
    from: {
      color: "black",
    },
    to: {
      color,
    },
    config: { duration: isAir || isUnit ? 150 : 400 },
    delay: isAir || isUnit ? 0 : 50,
    onRest: (result) => {
      setBlack(result.value.color === "black");
    },
  });

  const [black, setBlack] = useState(spring.color.get() === "rgba(0, 0, 0, 1)");

  if (!isAir && isHidden && !(isUnit && isFog)) return null;
  if (isAir && black) return null;

  const receiveShadow = !isAir && !isOpaque && !isHidden && !isUnit;

  if (layer.char === "█") {
    return <Box color={spring.color} height={height / stack} offset={offset} />;
  }

  return (
    <Text3D
      font="/fonts/MostPerfectDOSVGA.json"
      receiveShadow={receiveShadow}
      size={textSize}
      position={[
        -0.5 * dimensions.aspectRatio,
        -0.25,
        offset + (isUnit ? 3 : 0),
      ]}
      height={height / stack}
    >
      {isAir ? (
        <meshBasicMaterial color={shadowColor.current} />
      ) : isUnit ? (
        <animated.meshBasicMaterial color={spring.color} />
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
    [SPRITE]: SpriteType;
  };
}) {
  const isAir = entity[SPRITE] === fogSprite;
  const visibility = entity[FOG]?.visibility;
  const isVisible = visibility === "visible";
  const isOpaque = !!entity[LIGHT] && entity[LIGHT].darkness > 0;
  const isUnit = !!entity[NPC];

  return (
    <>
      {isOpaque && isVisible && <Box color={colors.black} height={height} />}
      {entity[SPRITE].layers.map((layer, index) => (
        <Layer
          isAir={isAir}
          isOpaque={isOpaque}
          isUnit={isUnit}
          visibility={visibility}
          layer={layer}
          key={index}
          offset={
            ((index + (isOpaque ? stack : 0) + (isAir ? stack * 2 : 0)) *
              height) /
            stack
          }
        />
      ))}
    </>
  );
}
