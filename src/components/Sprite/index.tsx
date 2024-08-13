import * as THREE from "three";
import { Text3D } from "@react-three/drei";
import { ThreeElements } from "@react-three/fiber";
import { useDimensions } from "../Dimensions";
import {
  Layer as LayerType,
  Sprite as SpriteType,
} from "../../engine/components/sprite";
import { Light } from "../../engine/components/light";
import * as colors from "../../game/assets/colors";
import { Fog } from "../../engine/components/fog";
import { fog as fogSprite } from "../../game/assets/sprites";
import { animated, useSpring } from "@react-spring/three";
import { useRef, useState } from "react";

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
  fog,
  isAir,
  isOpaque,
}: {
  layer: LayerType;
  offset: number;
  fog?: Fog;
  isAir: boolean;
  isOpaque: boolean;
}) {
  const dimensions = useDimensions();
  const shadowColor = useRef(
    `#${new THREE.Color(layer.color).multiplyScalar(0.125).getHexString()}`
  );

  const isHidden = !!fog && fog.visibility === "hidden";

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
    config: { duration: isAir ? 150 : 400 },
    delay: isAir ? 0 : 50,
    onRest: (result) => {
      setBlack(result.value.color === "black");
    },
  });

  const [black, setBlack] = useState(spring.color.get() === "rgba(0, 0, 0, 1)");

  if (!isAir && isHidden) return null;
  if (isAir && black) return null;

  const receiveShadow = !isAir && !isOpaque && !isHidden;

  if (layer.char === "█") {
    return <Box color={spring.color} height={height / stack} offset={offset} />;
  }

  return (
    <Text3D
      font="/fonts/MostPerfectDOSVGA.json"
      receiveShadow={receiveShadow}
      size={textSize}
      position={[-0.5 * dimensions.aspectRatio, -0.25, offset]}
      height={height / stack}
    >
      {isAir ? (
        <meshBasicMaterial color={shadowColor.current} />
      ) : (
        <animated.meshLambertMaterial color={spring.color} />
      )}
      {layer.char}
    </Text3D>
  );
}

export default function Sprite({
  sprite,
  light,
  fog,
}: {
  sprite: SpriteType;
  light?: Light;
  fog?: Fog;
}) {
  const isAir = sprite === fogSprite;
  const isVisible = !!fog && fog.visibility === "visible";
  const isOpaque = !!light && light.darkness > 0;

  return (
    <>
      {isOpaque && isVisible && <Box color={colors.black} height={height} />}
      {sprite.layers.map((layer, index) => (
        <Layer
          isAir={isAir}
          isOpaque={isOpaque}
          fog={fog}
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
