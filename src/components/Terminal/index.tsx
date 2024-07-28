import { useDimensions } from "../Dimensions";
import "./index.css";

export default function Terminal() {
  const dimensions = useDimensions();

  return (
    <main className="Terminal">
      <span className="Dummy">Terminal ({dimensions.columns} x {dimensions.rows}, {dimensions.cellHeight})</span>
    </main>
  );
}
