import { useDimensions } from "../Dimensions";
import "./index.css";

export default function Stats() {
  const dimensions = useDimensions();
  
  return (
    <header className="Stats">
      <br />
      <br />
      {'═'.repeat(dimensions.columns + 1 - dimensions.columns % 2)}
    </header>
  );
}
