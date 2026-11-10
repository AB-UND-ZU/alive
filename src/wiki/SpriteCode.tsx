import { Sprite } from "../engine/components/sprite";
import { colors } from "../game/assets/colors";
import { CodeBlock } from "./CodeBlock";
import { WikiToken } from "./types";

export function SpriteCode({ sprite }: { sprite?: Sprite }) {
  const syntax: NonNullable<WikiToken["syntax"]> = sprite
    ? [
        [
          { text: "export const ", kind: "keyword" },
          { text: "sprite: ", kind: "plain" },
          { text: "Sprite", kind: "type" },
          { text: " = {", kind: "plain" },
        ],
        [
          { text: "  name: ", kind: "plain" },
          { text: JSON.stringify(sprite.name), kind: "string" },
          { text: ",", kind: "plain" },
        ],
        [{ text: "  layers: [", kind: "plain" }],
        ...sprite.layers.map(
          (layer): NonNullable<WikiToken["syntax"]>[number] => {
            const color = Object.entries(colors).find(
              ([, value]) => value === layer.color
            )?.[0];
            return [
              { text: "    { char: ", kind: "plain" },
              { text: JSON.stringify(layer.char), kind: "string" },
              { text: ", color: ", kind: "plain" },
              {
                text: color ? `colors.${color}` : JSON.stringify(layer.color),
                kind: color ? "plain" : "string",
              },
              { text: " },", kind: "plain" },
            ];
          }
        ),
        [{ text: "  ],", kind: "plain" }],
        [{ text: "};", kind: "plain" }],
      ]
    : [];
  return (
    <CodeBlock
      text={syntax
        .map((line) => line.map((part) => part.text).join(""))
        .join("\n")}
      syntax={syntax}
      language="ts sprite.ts"
      source="wiki/sprites.md"
    />
  );
}
