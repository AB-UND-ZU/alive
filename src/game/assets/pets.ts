import { Layer } from "../../engine/components/sprite";
import { choice } from "../math/std";
import { colors } from "./colors";
import { customSprite } from "./spriteIds";

const furColors = [
  [colors.red, colors.maroon],
  [colors.maroon, colors.maroon],
  [colors.lime, colors.green],
  [colors.green, colors.green],
  [colors.white, colors.white],
  [colors.white, colors.grey],
  [colors.silver, colors.grey],
  [colors.grey, colors.grey],
  ...[
    [colors.yellow, colors.olive],
    [colors.blue, colors.navy],
    [colors.fuchsia, colors.purple],
    [colors.aqua, colors.teal],
  ].flatMap(([bright, dark]) => [
    [bright, bright], [dark, dark], [bright, dark], [dark, bright],
  ]),
];

export function createPetSprite() {
  const [earColor, tailColor] = choice(...furColors);
  const body = choice(
    ...[colors.grey, colors.silver, colors.white].filter(
      (color) => color !== earColor && color !== tailColor
    )
  );
  const ears = choice("", '"', "î", "┘", "\u010f");
  const layers: Layer[] = [];
  if (ears === "\u010f") {
    layers.push(
      { char: ears, color: earColor },
      { char: "√", color: earColor },
      { char: "ƒ", color: colors.black },
      { char: "Y", color: earColor },
      { char: "■", color: colors.black },
      { char: "\u0115", color: colors.black }
    );
  } else if (ears) {
    layers.push({ char: ears, color: earColor });
  }
  if (ears !== "┘") {
    const tail = ears ? choice("g", "µ", "") : choice("g", "µ");
    if (tail) layers.push({ char: tail, color: tailColor });
  }

  layers.push({ char: "■", color: colors.black }, { char: "\u0101", color: body });
  const mouth = choice("full", "upper", "lower", "tiny");
  if (mouth === "tiny") {
    layers.push({ char: "+", color: body });
  } else if (choice(false, true)) {
    layers.push({ char: "+", color: colors.black }, { char: "|", color: body });
  }
  layers.push({ char: "∙", color: mouth === "upper" ? body : colors.black });
  if (mouth !== "full") {
    layers.push({ char: "·", color: mouth === "upper" ? colors.black : body });
  }

  return customSprite({ name: "Pet", layers });
}
