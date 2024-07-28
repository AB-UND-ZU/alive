import { useDimensions } from "../Dimensions";
import "./index.css";

export default function Controls() {
  const dimensions = useDimensions();

  return <footer className="Controls">{"═".repeat(dimensions.columns)}</footer>;
}
