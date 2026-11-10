import { colors } from "../game/assets/colors";
import { commandSignatures } from "../game/assets/commands";
import { PlainTable, Text, Literal } from "./visuals";

export function CommandReference() {
  return (
    <PlainTable
      headers={["Command", "Action", "Example"]}
      rows={Object.entries(commandSignatures).map(([name, command]) => [
        <div>
          <Text color={colors.white}>{command.usage}</Text>
          <div>
            <Text>{`/${command.short}`}</Text>
          </div>
        </div>,
        <Text>{commandDescriptions[name]}</Text>,
        <Literal>{commandExamples[name]}</Literal>,
      ])}
    />
  );
}
const commandExamples: Record<string, string> = {
  help: "/help give",
  list: "/list item",
  give: "/give sword 1 iron fire",
  stat: "/stat hp 25",
  cast: "/cast wave wood water",
  tp: "/tp 4,4",
  mod: "/mod swim",
  focus: "/focus target",
  new: "/new tree 3 right",
  pin: "/pin target 8,4",
};
const commandDescriptions: Record<string, string> = {
  help: "Show usage. Without a command name, show the help prompt.",
  list: "List commands, items, cells, stats or named locations.",
  give: "Drop an item nearby. Defaults to one item. Potion's last argument is a stat; other items use an element. Material default clears the material.",
  stat: "Read or set a stat, defeated-unit count or view priority.",
  cast: "Cast an ability directly. Material defaults to Wood; Zap and Block cannot be cast this way.",
  tp: "Move to coordinates or a named entity. Coordinates wrap at world edges.",
  mod: "Change movement, faction or combat stats.",
  focus: "Highlight a named entity. No argument clears the highlight.",
  new: "Place cells ahead. Defaults to one cell facing the hero's direction, or up. Use /new air to clear cells without removing the hero or buildings.",
  pin: "Name a location. Omitted coordinates use the hero's position. Names must be unique.",
};
