import { Sprite } from "../engine/components/sprite";
import {
  grass,
  path,
  rogue,
  rogueBackdrop,
  tree1,
  waterDeep,
  woodChest,
} from "../game/assets/sprites";
import { colors } from "../game/assets/colors";
import { addBackground } from "../game/assets/ui";
import { projectSprite } from "../renderers/terminal/sprites";
import { GridTable } from "./GridTable";
import { Pixels, textSprites } from "./visuals";
import { rendererHeaders } from "./RendererComparison";

const hero: Sprite = {
  name: rogue.name,
  layers: [...rogueBackdrop.layers, ...rogue.layers],
};
const rows = [
  [waterDeep, waterDeep, waterDeep, waterDeep, waterDeep],
  [waterDeep, grass, grass, grass, waterDeep],
  [waterDeep, tree1, hero, woodChest, waterDeep],
  [waterDeep, path, path, path, waterDeep],
  [waterDeep, waterDeep, waterDeep, waterDeep, waterDeep],
];
const source = rows.map((row) => addBackground(row, colors.black));
const projected = rows.map((row) =>
  row.map((sprite) => {
    const cell = projectSprite(sprite);
    return addBackground(
      textSprites(cell.char, cell.foreground),
      cell.background || colors.black
    )[0];
  })
);

export function RendererExamples() {
  return (
    <GridTable
      headers={rendererHeaders()}
      rows={[
        [
          <Pixels rows={source} label="ThreeJS sprite example" />,
          <Pixels rows={source} label="HTML sprite example" />,
          <Pixels rows={projected} label="Terminal sprite example" />,
        ],
      ]}
      compact
      rowHeaders={false}
    />
  );
}
