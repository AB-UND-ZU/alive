import { useRenderable } from "../World/hooks";
import { PLAYER } from "../../engine/components/player";
import { POSITION } from "../../engine/components/position";
import { OrthographicCamera } from "@react-three/drei";
import { useDimensions } from "../Dimensions";

export default function Camera() {
  const dimensions = useDimensions();
  const players = useRenderable([PLAYER]);
  const player = players[0];

  if (!player) return null;

  const position = player[POSITION];

  return (
    <OrthographicCamera
      makeDefault
      position={[(position.x || 0) * dimensions.aspectRatio, -(position.y || 0), 32]}
      zoom={32}
      near={0.1}
      far={64}
    />
  );
}
