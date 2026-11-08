import { useState } from "react";
import {
  commandItems,
  commandSignatures,
  executeCommand,
  parseCommand,
} from "../game/assets/commands";
import { assertHero, advance } from "../testing/harness";
import { createPreviewWorld } from "./scenes";
import { completeCommand } from "./commands";
import {
  Button,
  Frame,
  Input,
  ItemView,
  PlainTable,
  Selection,
  Text,
  Pixels,
  Literal,
  textSprites,
} from "./visuals";
import { colors } from "../game/assets/colors";
import { Sprite } from "../engine/components/sprite";
import { previewItem, getEffectSprite } from "./catalog";
import { getItemSprite } from "../game/assets/utils";
import { worldRows } from "./WorldDiagram";

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
  new: "Place cells ahead. Defaults to one cell facing the hero's direction, or up. No argument clears the cell ahead except the hero and buildings.",
  pin: "Name a location. Omitted coordinates use the hero's position. Names must be unique.",
};
export function CommandBuilder() {
  const [world] = useState(() => createPreviewWorld("chat"));
  const [value, setValue] = useState("/give ");
  const [selected, setSelected] = useState(0);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<string | Sprite[]>("");
  const [revision, setRevision] = useState(0);
  const matches = completeCommand(value);
  const completion = matches[selected]?.slice(value.length) || "";
  const update = (next: string) => {
    setValue(next);
    setSelected(0);
  };
  const run = () => {
    const command = parseCommand(value.trimEnd());
    if (!command) return;
    const output = executeCommand(world, assertHero(world), command);
    advance(world, 100);
    setResult(output || "Done.");
    setRevision((n) => n + 1);
  };
  const results = Object.keys(commandItems).filter((name) =>
    name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div
      role="group"
      aria-label="Command builder"
      data-widget="commands"
      data-hp={assertHero(world).STATS?.hp}
      data-revision={revision}
    >
      <Input
        label="Command"
        value={value}
        completion={completion}
        onChange={update}
        onKeyDown={(event) => {
          if (event.key === "Tab" && matches.length) {
            event.preventDefault();
            update(matches[selected] + " ");
          } else if (
            ["ArrowDown", "ArrowUp"].includes(event.key) &&
            matches.length
          ) {
            event.preventDefault();
            setSelected(
              (i) =>
                (i +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  Math.min(matches.length, 20)) %
                Math.min(matches.length, 20)
            );
          } else if (event.key === "Enter") {
            event.preventDefault();
            run();
          }
        }}
      />
      <div className="Suggestions" role="listbox" aria-label="Completion">
        {matches.slice(0, 20).map((match, i) => (
          <Selection
            key={match}
            label={match}
            selected={i === selected}
            onClick={() => update(match + " ")}
          />
        ))}
      </div>
      <div className="ButtonRow">
        <Button palette="lime" onClick={run}>
          Run
        </Button>
        <Button
          palette="lime"
          onClick={() => navigator.clipboard.writeText(value.trimEnd())}
        >
          Copy
        </Button>
      </div>
      {result && (
        <Frame label="Command result" title="Result">
          <output aria-label={typeof result === "string" ? result : undefined}>
            {typeof result === "string" ? (
              <Text color={colors.white}>{result}</Text>
            ) : (
              <Pixels rows={[result]} />
            )}
          </output>
          <div>
            <Literal>{`${assertHero(world).POSITION.x},${
              assertHero(world).POSITION.y
            }`}</Literal>
          </div>
          <Pixels
            rows={worldRows(world, {
              x: assertHero(world).POSITION.x - 4,
              y: assertHero(world).POSITION.y - 2,
              width: 9,
              height: 5,
            })}
            label="Command world"
          />
        </Frame>
      )}
      <Input label="Search items" value={search} onChange={setSearch} />
      <div className="Suggestions" role="listbox" aria-label="Items">
        {results.slice(0, 20).map((name) => (
          <Selection
            key={name}
            label={name}
            selected={false}
            onClick={() => update(`/give ${name} `)}
            cells={[
              getEffectSprite(previewItem(commandItems[name])) ||
                getItemSprite(previewItem(commandItems[name]), "display"),
              ...textSprites(" " + name),
            ]}
          />
        ))}
      </div>
      {search && results.length === 1 && (
        <ItemView item={commandItems[results[0]]} />
      )}
    </div>
  );
}
