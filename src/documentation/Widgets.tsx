import { Damage } from "./Damage";
import { getStatColor } from "../game/assets/ui";
import { Parts, ItemCatalogEntry, UnitCatalogEntry } from "./CatalogEntry";
import { Sprite } from "../engine/components/sprite";
import { LargePreview } from "./LargePreview";
import {
  itemPage,
  itemCategory,
  unitPage,
  unitCategory,
  displayName,
  previewItem,
  catalogItems,
  unitName,
  unitGroups,
  unitFamily,
  fishItems,
} from "./catalog";
import { tribes, enemies, neutrals } from "../engine/components/belongable";
import { levelConfig } from "../game/levels";
import {
  purchasableItems,
  getItemBuyPrice,
  getItemSellPrice,
} from "../game/balancing/trading";
import {
  initialDimensions,
  useResizeListener,
} from "../components/Dimensions/sizing";
import { getHasteInterval } from "../engine/systems/movement";
import * as questSequences from "../game/assets/quests";
import { unitDefinitions } from "../game/balancing/units";
import { UnitKey } from "../game/balancing/units";
import {
  referenceId,
  ReferenceText,
  ReferenceContext,
  MentionStyle,
} from "./references";
import { useContext, useEffect, useState } from "react";
import { commandItems, commandSignatures } from "../game/assets/commands";
import { craftingIngredients } from "../game/balancing/crafting";
import { brewingRecipes } from "../game/balancing/brewing";
import { getLevelStats } from "../engine/systems/leveling";
import { ClassKey } from "../game/balancing/classes";
import { classDefinitions } from "../game/balancing/classes";
import { buildConstructions } from "../game/balancing/building";
import {
  harvestTools,
  getHarvestConfig,
  plantConfigs,
  harvestDurationFactor,
} from "../game/balancing/harvesting";
import { fishingDistributionLevels } from "../game/balancing/fishing";
import { getForgeOptions } from "../game/balancing/forging";
import { stackableConsumptions } from "../engine/systems/consume";
import { createWorld } from "../engine";
import { unitStats, attributes } from "../engine/components/stats";
import { Item } from "../engine/components/item";
import { slots, equipments } from "../engine/components/equippable";
import { getItemSprite, getUnitSprite } from "../game/assets/utils";
import { getItemDescription } from "../game/assets/descriptions";
import "./catalog.css";

import { colors } from "../game/assets/colors";
import {
  Frame,
  StatLabel,
  SlotLabel,
  Button,
  Selection,
  Input,
  ItemView,
  Pixels,
  PlainTable,
  Text,
  textSprites,
} from "./visuals";
import { completeCommand } from "./commands";
const Lines = ({ values }: { values: readonly string[] }) =>
  values.length ? (
    <div className="CatalogLines">
      {values.map((value, index) => (
        <div key={index}>
          <ReferenceText text={value} />
        </div>
      ))}
    </div>
  ) : null;
function CatalogIndex({
  entries,
}: {
  entries: {
    key: string;
    sprite: Sprite;
    color?: string;
    redirected?: boolean;
  }[];
}) {
  const {
    link,
    entries: references,
    route: pageRoute,
  } = useContext(ReferenceContext);
  const cellWidth = Math.max(
    8,
    ...entries.map((entry) => entry.sprite.name.length + 3)
  );
  const count = [1, 2, 3, 4].reduce((best, columns) => {
    const difference = (value: number) =>
      Math.abs(
        (value * cellWidth + 2) * 18 -
          (Math.ceil(entries.length / value) + 2) * 32
      );
    return difference(columns) < difference(best) ? columns : best;
  }, 1);
  return (
    <Frame
      className="CatalogOverview"
      label="Catalog index"
      columns={count * cellWidth + 2}
    >
      <div
        className="CatalogIndex"
        aria-label="Catalog index"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${
            cellWidth * 18
          }px), 1fr))`,
        }}
      >
        {entries.map(({ key, sprite, color = colors.grey, redirected }) => {
          const reference = references[key] || references[key.toLowerCase()];
          const target = reference?.href || `#${referenceId(key)}`;
          const [route, anchor] = target.split("#");
          const href =
            !route || route === pageRoute
              ? `#${anchor || referenceId(key)}`
              : target;
          return (
            <span key={key} id={redirected ? referenceId(key) : undefined}>
              {link(
                href,
                <MentionStyle preserveColor>
                  <span className="Item" style={{ gap: 0 }}>
                    <Pixels rows={[[sprite]]} label={sprite.name} />
                    <Text color={color}>{sprite.name}</Text>
                  </span>
                </MentionStyle>,
                true
              )}
            </span>
          );
        })}
      </div>
    </Frame>
  );
}
function CommandBuilder() {
  const [value, setValue] = useState("/give "),
    [selected, setSelected] = useState(0),
    [result, setResult] = useState("");
  const matches = completeCommand(value),
    completion = matches[selected]?.slice(value.length) || "";
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const frame = document.querySelector<HTMLIFrameElement>(
        "[data-scene=chat] iframe"
      );
      if (
        event.origin === window.location.origin &&
        event.source === frame?.contentWindow &&
        event.data.type === "command-result"
      )
        setResult(`${value.trimEnd()} → ${event.data.result}`);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [value]);
  const update = (next: string) => {
    setValue(next);
    setSelected(0);
  };
  return (
    <div data-widget="commands">
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
              (index) =>
                (index +
                  (event.key === "ArrowDown" ? 1 : -1) +
                  Math.min(matches.length, 20)) %
                Math.min(matches.length, 20)
            );
          }
        }}
      />
      <div className="Suggestions" role="listbox" aria-label="Completion">
        {matches.slice(0, 20).map((match, i) => {
          const item = catalogItems[match.split(" ").pop()!];
          const cells = [
            ...(item ? [getItemSprite(item)] : []),
            ...textSprites(" " + match),
          ];
          return (
            <Selection
              key={match}
              label={match}
              selected={i === selected}
              onClick={() => update(match + " ")}
              cells={cells}
            />
          );
        })}
      </div>
      <div className="ButtonRow">
        <Button
          onClick={() => {
            window.dispatchEvent(
              new CustomEvent("docs-command", { detail: value.trimEnd() })
            );
          }}
        >
          Run
        </Button>
        <Button onClick={() => navigator.clipboard.writeText(value.trimEnd())}>
          Copy
        </Button>
      </div>
      <output aria-label={result}>
        <Text color={colors.lime}>{result}</Text>
      </output>
    </div>
  );
}
function ResponsiveData() {
  const [dimensions, setDimensions] = useState(initialDimensions);
  useResizeListener(setDimensions);
  return (
    <PlainTable
      headers={["Viewport / layout", "Current value"]}
      rows={[
        ["Screen", `${dimensions.screenWidth} x ${dimensions.screenHeight}`],
        ["Character", `${dimensions.cellWidth} x ${dimensions.cellHeight}`],
        ["Columns / rows", `${dimensions.columns} / ${dimensions.rows}`],
        ["Minimum visible columns", String(dimensions.visibleColumns)],
        ["HUD rows", String(dimensions.hudRows)],
        [
          "Terminal",
          `${dimensions.terminalWidth} x ${dimensions.terminalHeight.toFixed(
            2
          )}`,
        ],
      ]}
    />
  );
}
function TimerData() {
  const [world] = useState(createWorld);
  return (
    <PlainTable
      headers={["Clock", "Interval"]}
      rows={[
        ["Systems update", "30 updates / second"],
        ["World reference", `${getHasteInterval(world, -1)} ms`],
        ...[0, 1, 5].map((haste) => [
          `Player (haste ${haste})`,
          `${getHasteInterval(world, haste)} ms`,
        ]),
        ["Sequence", "Elapsed milliseconds since creation"],
      ]}
    />
  );
}
export function Widget({ name }: { name: string }) {
  const [search, setSearch] = useState("");
  const [kind, category] = name.split(" ");
  if (name === "stats")
    return (
      <PlainTable
        headers={["Stat", "Effect"]}
        rows={unitStats.map((stat) => [
          <span>
            <ItemView item={{ stat }} />
            {stat.endsWith("Cap") && <Text> Limit</Text>}
            {stat === "maxXp" && <Text> To Level</Text>}
          </span>,
          stat.endsWith("Cap") ? (
            <Text>Class limit for this maximum.</Text>
          ) : stat === "maxXp" ? (
            <Text>Experience required for the next level.</Text>
          ) : stat === "hp" ? (
            <Text>Current health.</Text>
          ) : stat === "mp" ? (
            <Text>Current mana.</Text>
          ) : stat === "xp" ? (
            <Text>Experience earned toward the next level.</Text>
          ) : (
            <Pixels rows={getItemDescription({ stat })} />
          ),
        ])}
      />
    );
  if (name === "responsive") return <ResponsiveData />;
  if (name === "timers") return <TimerData />;
  if (name === "levels")
    return (
      <PlainTable
        headers={["Level", "Size", "Vision", "Exit"]}
        rows={Object.values(levelConfig).map((level) => [
          level.name,
          String(level.size),
          String(level.vision),
          <Lines values={level.warps.map((warp) => levelConfig[warp].name)} />,
        ])}
      />
    );
  if (name === "factions")
    return (
      <PlainTable
        headers={["Group", "Factions"]}
        rows={[
          ["Tribes", <Lines values={tribes} />],
          ["Enemies", <Lines values={enemies} />],
          ["Neutral", <Lines values={neutrals} />],
        ]}
      />
    );
  if (name === "slots")
    return (
      <PlainTable
        headers={["Slot", "Items"]}
        rows={equipments.map((slot) => [
          <span id={referenceId(slot)}>
            <SlotLabel slot={slot} />
          </span>,
          <div className="CatalogLines">
            {Object.values(catalogItems)
              .filter((item) =>
                slot in item
                  ? Boolean(item[slot as keyof typeof item])
                  : item.accessory === slot
              )
              .map((item, index) => (
                <div key={index}>
                  <ItemView item={item} />
                </div>
              ))}
          </div>,
        ])}
      />
    );
  if (name === "gear-slots")
    return (
      <PlainTable
        headers={["Slot", "Items"]}
        rows={slots.map((slot) => [
          displayName(slot),
          <Parts
            items={Object.values(catalogItems).filter((item) =>
              Boolean(item[slot])
            )}
          />,
        ])}
      />
    );
  if (name === "trading")
    return (
      <PlainTable
        headers={["Item", "Buy price", "Sell price"]}
        rows={purchasableItems.map((item) => [
          <ItemView item={item} />,
          <Parts items={getItemBuyPrice(item)} />,
          <Parts items={getItemSellPrice(item)} />,
        ])}
      />
    );
  if (name === "quests")
    return (
      <PlainTable
        headers={["Sequence", "Area / purpose"]}
        rows={Object.keys(questSequences).map((key) => [
          key,
          (
            {
              menuQuest: "Menu portal",
              centerQuest: "Dungeon center",
              north1Quest: "Dungeon north rooms",
              north2Quest: "Dungeon keys and doors",
              north2East1Quest: "Dungeon east room",
              spawnQuest: "Island arrival",
              waypointQuest: "Track a target",
              tombstoneQuest: "Recover belongings",
            } as Record<string, string>
          )[key] || "Quest sequence",
        ])}
      />
    );
  if (name === "sprite-layers")
    return (
      <>
        <LargePreview
          item={{ weapon: "sword", material: "iron", element: "fire" }}
        />
        <PlainTable
          headers={["Layer", "Meaning"]}
          rows={[
            ["Character", "Glyph from the bundled font"],
            ["Color", "One of the game palette colors"],
            ["Facing", "Orientation-specific character layers"],
            ["Stack dots", "Quantity marks on the native pixel grid"],
          ]}
        />
      </>
    );

  if (name === "animals") {
    return (
      <div>
        <CatalogIndex
          entries={[
            {
              key: "chick",
              sprite: { ...getUnitSprite("chick"), name: "Chick" },
            },
            {
              key: "worm",
              sprite: getItemSprite({ stackable: "worm" }, "display"),
            },
            {
              key: "fish",
              sprite: {
                ...getItemSprite(fishItems[0], "display"),
                name: "Fish",
              },
            },
          ]}
        />
        <UnitCatalogEntry keys={["chick"]} />
        <ItemCatalogEntry name="worm" definition={commandItems.worm} />
        <ItemCatalogEntry
          name="fish"
          title="Fish"
          definition={fishItems[0]}
          family={fishItems.map((item) => ({
            name: item.stackable!,
            definition: item,
          }))}
        />
      </div>
    );
  }
  if (name === "elements") {
    const entries = Object.entries(catalogItems).filter(
      ([, item]) => item.stackable === "resource" && item.element
    );
    return (
      <div>
        <CatalogIndex
          entries={entries.map(([key, item]) => ({
            key,
            sprite: {
              ...getItemSprite(item, "display"),
              name: displayName(key),
            },
          }))}
        />
        {entries.map(([key, item]) => (
          <ItemCatalogEntry
            key={key}
            name={key}
            definition={item}
            title={displayName(key)}
          />
        ))}
      </div>
    );
  }
  if (name === "item-catalog" || (kind === "items" && category))
    return (
      <div>
        <CatalogIndex
          entries={Object.entries(catalogItems)
            .filter(
              ([, item]) =>
                !category ||
                itemCategory(item) === category ||
                itemPage(item) === category
            )
            .map(([key, item]) => ({
              key,
              sprite: {
                ...getItemSprite(previewItem(item), "display"),
                ...(itemPage(item) === "elements"
                  ? { name: displayName(key) }
                  : {}),
              },
              redirected: Boolean(category && itemPage(item) !== category),
            }))}
        />
        {Object.entries(catalogItems)
          .filter(([, item]) => !category || itemPage(item) === category)
          .map(([key, definition]) => (
            <ItemCatalogEntry key={key} name={key} definition={definition} />
          ))}
      </div>
    );
  if (name === "unit-catalog" || kind === "units") {
    const keys = (Object.keys(unitDefinitions) as UnitKey[]).filter(
      (key) =>
        !category ||
        unitCategory(key, unitDefinitions[key]) === category ||
        unitPage(key, unitDefinitions[key]) === category
    );
    const groups = unitGroups(keys);
    return (
      <div>
        <CatalogIndex
          entries={groups.map((group) => {
            const key = group[0],
              unit = unitDefinitions[key];
            return {
              key,
              redirected: Boolean(category && unitPage(key, unit) !== category),
              sprite: {
                ...getUnitSprite(key),
                name:
                  group.length > 1
                    ? displayName(unitFamily(key))
                    : unitName(key, unit),
              },
              color:
                unit.faction === "wild"
                  ? colors.maroon
                  : unit.faction === "unit" || unit.faction === "animal"
                  ? colors.grey
                  : colors.green,
            };
          })}
        />
        {groups
          .filter(
            (group) =>
              !category ||
              unitPage(group[0], unitDefinitions[group[0]]) === category
          )
          .map((group) => (
            <UnitCatalogEntry key={group[0]} keys={group} />
          ))}
      </div>
    );
  }
  if (name === "damage") return <Damage />;
  if (name === "commands") return <CommandBuilder />;
  if (name === "classes") {
    const keys = Object.keys(classDefinitions) as ClassKey[];
    return (
      <PlainTable
        headers={[
          "Classes",
          ...keys.map((key) => (key === "???" ? "Unknown" : displayName(key))),
        ]}
        rows={[
          [
            "Sprite",
            ...keys.map((key) => (
              <span id={referenceId(key) || "unknown-class"}>
                <LargePreview unit={classDefinitions[key]} />
              </span>
            )),
          ],
          ...Array.from({ length: 11 }, (_, index) => index + 1).map(
            (level) => [
              <div className="CatalogLines">
                <div>
                  <StatLabel stat="level" />
                </div>
                <div>
                  <Text color={getStatColor("level")}>{String(level)}</Text>
                </div>
              </div>,
              ...keys.map((key) => {
                const stats = getLevelStats(key, level);
                return (
                  <div className="CatalogLines">
                    <div>
                      <StatLabel stat="hp" />
                      <Text
                        color={getStatColor("hp")}
                      >{` ${stats.maxHp}`}</Text>
                    </div>
                    <div>
                      <StatLabel stat="mp" />
                      <Text
                        color={getStatColor("mp")}
                      >{` ${stats.maxMp}`}</Text>
                    </div>
                  </div>
                );
              }),
            ]
          ),
          ...attributes
            .filter(
              (stat) =>
                ![
                  "hp",
                  "maxHp",
                  "maxHpCap",
                  "mp",
                  "maxMp",
                  "maxMpCap",
                  "xp",
                  "maxXp",
                  "maxXpCap",
                  "level",
                ].includes(stat) &&
                keys.some((key) => classDefinitions[key].stats[stat] !== 0)
            )
            .map((stat) => [
              <StatLabel stat={stat} />,
              ...keys.map((key) => classDefinitions[key].stats[stat]),
            ]),
        ]}
      />
    );
  }
  if (name === "crafting")
    return (
      <PlainTable
        headers={["Result", "Ingredients"]}
        rows={craftingIngredients.map((r) => [
          <ItemView item={r.item} amount />,
          <Parts items={r.parts} />,
        ])}
      />
    );
  if (name === "brewing")
    return (
      <PlainTable
        headers={["Result", "Ingredients"]}
        rows={brewingRecipes.flatMap((r) =>
          r.options.map((parts) => [
            <ItemView item={r.item} amount />,
            <Parts items={parts} />,
          ])
        )}
      />
    );
  if (name === "building")
    return (
      <PlainTable
        headers={["Structure", "Parts", "Level", "Ground"]}
        rows={buildConstructions.map((p) => [
          <Pixels rows={[[p.sprite]]} label={p.sprite.name} />,
          <Parts items={p.parts} />,
          String(p.level),
          <Lines values={p.grounds} />,
        ])}
      />
    );
  if (name === "harvesting")
    return (
      <PlainTable
        headers={["Target", "Tool", "Work", "Drops"]}
        rows={Object.entries(harvestTools).map(([key, tool]) => {
          const data = getHarvestConfig(
            key as Parameters<typeof getHarvestConfig>[0]
          );
          return [
            <ReferenceText text={key} />,
            <ItemView item={{ tool, material: "wood" }} />,
            String(data.harvestable.maximum),
            <Parts items={data.yields} />,
          ];
        })}
      />
    );
  if (name === "farming")
    return (
      <PlainTable
        headers={["Plant", "Result", "World ticks"]}
        rows={Object.entries(plantConfigs).map(([key, c]) => [
          <ItemView item={{ stackable: key as Item["stackable"] }} />,
          c.crop ? <ItemView item={c.crop} /> : c.cell!,
          String(c.duration * harvestDurationFactor),
        ])}
      />
    );
  if (name === "fishing")
    return (
      <PlainTable
        headers={["Catch", "Level 1", "Level 2", "Level 3"]}
        rows={Array.from(
          new Set(
            fishingDistributionLevels.flatMap((level) =>
              level.map(([, item]) => item.stackable!)
            )
          )
        ).map((key) => [
          <ItemView item={{ stackable: key as Item["stackable"] }} />,
          ...fishingDistributionLevels
            .slice(1)
            .map(
              (level) =>
                `${level.find(([, item]) => item.stackable === key)?.[0] || 0}%`
            ),
        ])}
      />
    );
  if (name === "food")
    return (
      <PlainTable
        headers={["Item", "Effect"]}
        rows={Object.entries(stackableConsumptions).map(([key, v]) => [
          <ItemView item={{ stackable: key as Item["stackable"] }} />,
          `${v.amount > 0 ? "+" : ""}${v.amount}${
            v.percentage ? "%" : ""
          } ${v.countable.toUpperCase()}`,
        ])}
      />
    );
  if (name === "forging")
    return (
      <PlainTable
        headers={["Base", "Add", "Result"]}
        rows={Object.keys(commandItems).flatMap((key) =>
          getForgeOptions({
            ...commandItems[key],
            material: "wood",
            amount: 1,
            carrier: 0,
            bound: false,
          }).map((v) => [
            <ItemView item={v.base} />,
            <ItemView item={v.add} amount />,
            <ItemView item={v.result} />,
          ])
        )}
      />
    );
  if (name === "items")
    return (
      <div>
        <Input label="Search items" value={search} onChange={setSearch} />
        <div className="ItemIndex">
          {Object.keys(catalogItems)
            .sort()
            .filter((key) => key.includes(search.toLowerCase()))
            .map((key) => (
              <span key={key} data-item-name={key}>
                <ItemView item={catalogItems[key]} />
              </span>
            ))}
        </div>
        <PlainTable
          headers={["Command", "Alias", "Arguments"]}
          rows={Object.entries(commandSignatures).map(([key, s]) => [
            "/" + key,
            "/" + s.short,
            s.usage,
          ])}
        />
      </div>
    );
  return null;
}
