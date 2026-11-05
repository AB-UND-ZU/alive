import { useMemo } from "react";
import { useDimensions } from "../Dimensions";
import "./index.css";

const cursor = `\
.........
.........
...██....
..████...
.██████..
...██....
...██....
...██....
...██....
...██....
...██....
...██....\
`;
const hotspot = { x: 4, y: 2 };

const assetToBase64 = (asset: string, scale = 1) => {
  const rows = asset.split("\n");
  const canvas = document.createElement("canvas");
  canvas.width = rows[0].length * scale;
  canvas.height = rows.length * scale;

  const context = canvas.getContext("2d");
  if (!context) return "";

  context.imageSmoothingEnabled = false;
  context.fillStyle = "#fff";

  rows.forEach((row, y) =>
    row.split("").forEach((char, x) => {
      if (char !== ".") {
        context.fillRect(x * scale, y * scale, scale, scale);
      }
    })
  );

  return canvas.toDataURL("image/png");
};

export default function Cursor() {
  const dimensions = useDimensions();

  const pixelSize = dimensions.pixelSize;

  // rasterizing and encoding the cursor only depends on the pixel size
  const [single, double] = useMemo(
    () => [
      assetToBase64(cursor, Math.round(pixelSize)),
      assetToBase64(cursor, Math.round(pixelSize * 2)),
    ],
    [pixelSize]
  );

  if (!single || !double) return null;

  const cursorStyle = `
    body {
      cursor: url(${single}), auto;
      cursor: image-set(url(${single}) 1x, url(${double}) 2x) ${
    Math.round(dimensions.pixelSize * hotspot.x)
  } ${Math.round(dimensions.pixelSize * hotspot.y)}, auto;
    }
  `;
  return <style>{cursorStyle}</style>;
}
