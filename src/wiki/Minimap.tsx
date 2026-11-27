import { useState } from "react";
import { Pixels, Text } from "./visuals";
import { customSprite } from "../game/assets/spriteIds";
import snapshot from "./minimap.json";

const sample = {
  ...snapshot.sample,
  rows: snapshot.sample.rows.map((rows) =>
    rows.map((row) => row.map(customSprite))
  ),
};
export const minimapSnapshots = () => sample;

export function Minimap() {
  const [sample] = useState(minimapSnapshots);
  return (
    <div className="DialogGallery" data-widget="minimap">
      {sample.rows.map((rows, index) => (
        <figure className="DialogSnapshot" key={index}>
          <figcaption>
            <Text color="#ffffff">{`Zoom ${index + 1}`}</Text>
          </figcaption>
          <Pixels rows={rows} label={`Native minimap zoom ${index + 1}`} />
        </figure>
      ))}
    </div>
  );
}
