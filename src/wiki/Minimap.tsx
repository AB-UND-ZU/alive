import { useState } from "react";
import { Pixels, Text } from "./visuals";
import snapshot from "./minimap.json";

export const minimapSnapshots = () => snapshot.sample;

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
