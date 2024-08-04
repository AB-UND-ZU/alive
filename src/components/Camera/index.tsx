import { POSITION } from "../../engine/components/position";
import { OrthographicCamera } from "@react-three/drei";
import { useDimensions } from "../Dimensions";
import { useHero } from "../../bindings/hooks";

export default function Camera() {
  const dimensions = useDimensions();
  const hero = useHero();

  if (!hero) return null;

  const position = hero[POSITION];

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
