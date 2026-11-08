import { colors, orderedColors } from "../game/assets/colors";
import { codePage437 } from "./codePage";
import { Callout } from "./Callout";
import { createText } from "../game/assets/ui";
import { Pixels, PlainTable, Text } from "./visuals";
export function TextGallery({ name }: { name: string }) {
  if (name === "text-callout")
    return (
      <Callout label="THE ENTIRE GAME IS ONLY MADE OF TEXT CHARACTERS!">
        <Text>THE ENTIRE GAME IS ONLY MADE OF TEXT CHARACTERS!</Text>
      </Callout>
    );
  if (name === "palette")
    return (
      <div id="palette">
        <PlainTable
          headers={["Color", "Name", "Color", "Name"]}
          rows={Array.from({ length: 8 }, (_, index) =>
            [index, index + 8].flatMap((colorIndex) => {
              const color = orderedColors[colorIndex],
                label = Object.keys(colors).find(
                  (key) => colors[key as keyof typeof colors] === color
                )!;
              return [
                <Pixels
                  key={colorIndex}
                  rows={[createText("██", color)]}
                  label={label}
                />,
                <Text key={label}>
                  {label.charAt(0).toUpperCase() + label.slice(1)}
                </Text>,
              ];
            })
          )}
        />
      </div>
    );
  const hex = "0123456789ABCDEF";
  return (
    <div
      id="font-characters"
      className="GlyphAtlas"
      aria-label="256 CP437 characters in byte order"
    >
      <PlainTable
        compact
        headers={["", ...hex]}
        rows={Array.from({ length: 16 }, (_, row) => [
          <Text key={row} color={colors.grey}>
            {hex[row] + "0"}
          </Text>,
          ...Array.from({ length: 16 }, (_, column) => (
            <Pixels
              key={column}
              rows={[createText(codePage437[row * 16 + column], colors.white)]}
            />
          )),
        ])}
      />
    </div>
  );
}
