import { useDimensions } from "../Dimensions";
import "./index.css";

export default function Screen() {
  const dimensions = useDimensions();
  return (
    <main className="Screen">
      <span className="Dummy">Screen ({dimensions.width} x {dimensions.height})</span>
    </main>
  );
}
