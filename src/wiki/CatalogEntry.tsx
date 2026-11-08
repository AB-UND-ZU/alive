import {
  consumptionConfigs,
  getItemConsumption,
} from "../engine/systems/consume";
import { statConfig, Stats as DisplayStats } from "../game/assets/ui";
import { aura } from "../game/assets/sprites";
import { getItemSellPrice } from "../game/balancing/trading";
import { Item } from "../engine/components/item";
import { Sprite } from "../engine/components/sprite";
import { UnitStat } from "../engine/components/stats";
import { Faction } from "../engine/components/belongable";
import { UnitKey, unitDefinitions } from "../game/balancing/units";
import { colors } from "../game/assets/colors";
import { getItemDescription } from "../game/assets/descriptions";
import {
  getItemConfig,
  getItemSprite,
  getUnitSprite,
} from "../game/assets/utils";
import { getItemStats, getEquipmentStats } from "../game/balancing/equipment";
import {
  referenceId,
  ReferenceText,
  ReferenceLink,
  MentionStyle,
} from "./references";
import { EquippedPreview, equippedPortrait } from "./EquippedPreview";
import { RottenPreview } from "./WorldPlants";
import { AcquisitionSources } from "./AcquisitionSources";
import { BossDiagram } from "./BossDiagram";
import {
  Frame,
  Count,
  Pixels,
  PlainTable,
  Text,
  StatLabel,
  UnitView,
} from "./visuals";
import { LargePreview, previewBounds } from "./LargePreview";
import {
  displayName,
  itemVariants,
  unitFamily,
  getEffectSprite,
  previewItem,
  unitComparisonStats,
} from "./catalog";
import { ItemView } from "./visuals";

export function FactionLabel({ faction }: { faction: Faction }) {
  return (
    <ReferenceLink name="factions">
      <Text>{displayName(faction)}</Text>
    </ReferenceLink>
  );
}

export function Parts({ items }: { items: Partial<Item>[] }) {
  return (
    <span className="Parts">
      {items
        .filter((item) => item.amount !== 0)
        .map((item, i) => {
          const effect = getEffectSprite(item);
          return (
            <span key={i}>
              {effect ? (
                <ReferenceLink name={item.spell!} sprite>
                  <span className="Item" style={{ gap: 0 }}>
                    <Count color={colors.grey} value={item.amount ?? 1} />
                    <Pixels rows={[[effect]]} />
                    <Text color={colors.grey}>{displayName(item.spell!)}</Text>
                  </span>
                </ReferenceLink>
              ) : (
                <ItemView item={previewItem(item)} amount />
              )}
            </span>
          );
        })}
    </span>
  );
}

export function getCatalogDescription(item: Partial<Item>) {
  const rows = getItemDescription(item);
  if (item.skill === "totem") return rows.slice(2);
  return item.stackable === "resource" &&
    !item.element &&
    (item.material === "diamond" || item.material === "ruby")
    ? rows.slice(1)
    : rows;
}

export function narrativeRows(
  rows: Sprite[][],
  shownStats: string[] = [],
  retainCosts = false
) {
  return rows.flatMap((original) => {
    let row = original;
    let text = row
      .map((cell) =>
        cell.name === "text_generic"
          ? cell.layers[cell.layers.length - 1]?.char || ""
          : " "
      )
      .join("");
    const blockedSlot = text.search(/-\d+[\s/]*Slot\s*$/);
    if (blockedSlot >= 0) {
      row = row.slice(0, blockedSlot);
      text = text.slice(0, blockedSlot);
      if (!text.trim()) return [];
    }
    const repeated = row.some((cell) =>
      shownStats.some(
        (stat) =>
          statConfig[stat as keyof DisplayStats]?.sprite.name === cell.name
      )
    );
    if (!/^\s*[+-]?\d/.test(text) || !repeated) return [row];
    const cost = retainCosts
      ? row.findIndex(
          (cell) =>
            cell.name === "text_generic" &&
            cell.layers[cell.layers.length - 1]?.char === "-"
        )
      : -1;
    return cost >= 0 ? [row.slice(cost)] : [];
  });
}

export function CatalogDescription({ rows }: { rows: Sprite[][] }) {
  const content: (Sprite | string)[] = [];
  rows.forEach((row, index) => {
    const first = row.find(
      (cell) =>
        cell.name !== "text_generic" ||
        cell.layers[cell.layers.length - 1]?.char.trim()
    );
    const punctuation =
      first?.name === "text_generic" &&
      /^[.,!?;:]/.test(first.layers[first.layers.length - 1]?.char || "");
    if (index && !punctuation) content.push(" ");
    content.push(...row);
  });
  const words: (Sprite | string)[][] = [[]];
  for (const cell of content) {
    const text =
      typeof cell === "string"
        ? cell
        : cell.name === "text_generic"
        ? cell.layers[cell.layers.length - 1]?.char
        : undefined;
    if (text !== undefined && !text.trim()) {
      if (words[words.length - 1].length) words.push([]);
    } else words[words.length - 1].push(cell);
  }
  return (
    <p className="CatalogDescription">
      <MentionStyle preserveColor>
        {words
          .filter((word) => word.length)
          .map((word, index) => {
            const runs: { text?: string; color?: string; sprite?: Sprite }[] =
              [];
            for (const cell of word) {
              const text =
                typeof cell === "string"
                  ? cell
                  : cell.name === "text_generic"
                  ? cell.layers[cell.layers.length - 1]?.char
                  : undefined;
              const color =
                typeof cell === "string"
                  ? runs[runs.length - 1]?.color
                  : cell.layers[cell.layers.length - 1]?.color;
              const previous = runs[runs.length - 1];
              if (
                text !== undefined &&
                previous?.text !== undefined &&
                previous.color === color
              )
                previous.text += text;
              else
                runs.push(
                  text !== undefined
                    ? { text, color }
                    : { sprite: cell as Sprite }
                );
            }
            return (
              <span key={index}>
                {index > 0 && " "}
                <span className="Word">
                  {runs.map((run, runIndex) =>
                    run.sprite ? (
                      <ReferenceLink
                        key={runIndex}
                        name={run.sprite.name}
                        sprite
                      >
                        <Pixels rows={[[run.sprite]]} label={run.sprite.name} />
                      </ReferenceLink>
                    ) : (
                      <ReferenceText
                        key={runIndex}
                        text={run.text!}
                        color={run.color}
                        decorate={false}
                      />
                    )
                  )}
                </span>
              </span>
            );
          })}
      </MentionStyle>
    </p>
  );
}

export function ItemCatalogEntry({
  name,
  definition,
  title,
  family,
}: {
  name: string;
  definition: Partial<Item>;
  title?: string;
  family?: { name: string; definition: Partial<Item> }[];
}) {
  const variants = family
    ? family.map((entry) => entry.definition)
    : itemVariants(definition);
  const sprite = getItemSprite(variants[0], "display");
  const portraits = variants.map((item) => getItemSprite(item, "display"));
  const bounds = previewBounds(portraits);
  const consumptions = variants.map((item) =>
    getItemConsumption({
      ITEM: { ...item, amount: 1, carrier: 0, bound: false },
    })
  );
  const values = variants.map((item, index) => ({
    ...getItemStats(item),
    ...(item.consume === "potion" && item.material && item.stat
      ? (() => {
          const config =
            consumptionConfigs.potion?.[item.material]?.[item.stat];
          return config
            ? { [config.countable]: config.amount, retrigger: config.cooldown }
            : {};
        })()
      : {}),
    ...(consumptions[index]
      ? { [consumptions[index]!.countable]: consumptions[index]!.amount }
      : {}),
  }));
  const baseValues = variants.map((item) => ({
    ...getItemStats({ ...item, element: undefined }),
    ...(item.consume === "potion" && item.material && item.stat
      ? {
          retrigger:
            consumptionConfigs.potion?.[item.material]?.[item.stat]?.cooldown ||
            0,
        }
      : {}),
  }));
  const stats = Array.from(
    new Set(
      baseValues.flatMap((value) =>
        Object.entries(value)
          .filter(([, amount]) => typeof amount === "number" && amount !== 0)
          .map(([key]) => key)
          .filter((key) => !key.startsWith("add"))
      )
    )
  );
  const extraValues = variants.map((item) =>
    Object.entries(getItemStats(item)).filter(
      ([key, value]) =>
        typeof value === "number" &&
        value !== 0 &&
        !stats.includes(key) &&
        !key.startsWith("add")
    )
  );
  const auraKeys = ["addPower", "addWisdom", "addArmor", "addResist"] as const;
  const properties = ["material", "element", "stat"] as const;
  return (
    <section
      className="CatalogEntry"
      id={referenceId(name)}
      data-catalog-item={name}
    >
      <PlainTable
        headers={[
          title || sprite.name,
          ...variants.map((item) =>
            family
              ? getItemSprite(item, "display").name
              : variants.length === 1
              ? ""
              : [
                  item.material,
                  item.element,
                  item.consume === "potion" ? item.stat : "",
                ]
                  .filter(Boolean)
                  .map((value) => displayName(value!))
                  .join(" ")
          ),
        ]}
        rows={[
          [
            "Sprite",
            ...variants.map((item, index) => (
              <span id={family ? referenceId(family[index].name) : undefined}>
                <LargePreview
                  unit={{ sprite: getItemSprite(item, "display") }}
                  bounds={bounds}
                />
              </span>
            )),
          ],
          ...(variants.some((item) => equippedPortrait(item))
            ? [
                [
                  "Equipped",
                  ...variants.map((item) => <EquippedPreview item={item} />),
                ],
              ]
            : []),
          ...properties
            .filter(
              (property) =>
                definition.stackable !== "resource" &&
                !(definition.consume === "potion" && property === "stat") &&
                variants.some((item) => item[property])
            )
            .map((property) => [
              displayName(property),
              ...variants.map((item) =>
                !item[property] ? null : property === "material" ? (
                  <ItemView
                    item={{ stackable: "resource", material: item.material }}
                  />
                ) : property === "stat" ? (
                  <StatLabel stat={item.stat!} />
                ) : (
                  <ItemView
                    item={{
                      stackable: "resource",
                      material: "wood",
                      element: item.element,
                    }}
                  />
                )
              ),
            ]),
          ...stats.map((stat) => [
            <StatLabel stat={stat as keyof ReturnType<typeof getItemStats>} />,
            ...values.map((value, index) =>
              value[stat as keyof typeof value] ? (
                <span>
                  <StatLabel
                    stat={stat as keyof DisplayStats}
                    value={value[stat as keyof typeof value]}
                    percentage={
                      consumptions[index]?.countable === stat &&
                      consumptions[index]?.percentage
                    }
                  />
                </span>
              ) : null
            ),
          ]),
          ...(extraValues.some((entries) => entries.length)
            ? [
                [
                  "Extra stats",
                  ...extraValues.map((entries) => (
                    <div className="CatalogLines">
                      {entries.map(([stat, value]) => (
                        <div key={stat}>
                          <StatLabel
                            stat={stat as keyof DisplayStats}
                            value={value}
                          />
                        </div>
                      ))}
                    </div>
                  )),
                ],
              ]
            : []),
          ...(values.some((value) => auraKeys.some((stat) => value[stat]))
            ? [
                [
                  <span>
                    <Pixels rows={[[aura]]} />
                    <Text>Aura</Text>
                  </span>,
                  ...values.map((value) => (
                    <div className="CatalogLines">
                      {auraKeys.map((stat) =>
                        value[stat] ? (
                          <div key={stat}>
                            <StatLabel
                              stat={
                                stat
                                  .slice(3)
                                  .toLowerCase() as keyof DisplayStats
                              }
                              value={value[stat]}
                            />
                          </div>
                        ) : null
                      )}
                    </div>
                  )),
                ],
              ]
            : []),
          ...(consumptions.some(Boolean) ||
          variants.some((item) => item.consume === "potion")
            ? [
                [
                  "Consume",
                  ...variants.map((item, index) => {
                    const effect = consumptions[index];
                    const potion =
                      item.consume === "potion" && item.material && item.stat
                        ? consumptionConfigs.potion?.[item.material]?.[
                            item.stat
                          ]
                        : undefined;
                    return effect ? (
                      <StatLabel
                        stat={effect.countable}
                        value={effect.amount}
                        percentage={effect.percentage}
                      />
                    ) : potion ? (
                      <StatLabel
                        stat={potion.countable}
                        value={potion.amount}
                      />
                    ) : null;
                  }),
                ],
              ]
            : []),
          ...(name === "fish"
            ? [
                [
                  "Sell for",
                  ...variants.map((item) => (
                    <Parts items={getItemSellPrice(item)} />
                  )),
                ],
              ]
            : []),
          ...(definition.weapon === "wand"
            ? [
                [
                  <span>
                    <Text>Contact </Text>
                    <StatLabel stat="true" />
                  </span>,
                  ...variants.map((item) => (
                    <StatLabel
                      stat="true"
                      value={getEquipmentStats(item).true}
                    />
                  )),
                ],
              ]
            : []),
          [
            "Obtained from",
            ...variants.map((item) => <AcquisitionSources item={item} />),
          ],
          [
            "Info",
            ...variants.map((item, index) => {
              const config = getItemConfig(item);
              return config?.getDescription ||
                config?.descriptions?.[item.material || "default"]?.[
                  item.element || "default"
                ] ? (
                <CatalogDescription
                  rows={narrativeRows(
                    getCatalogDescription(item),
                    Object.keys(values[index]),
                    Boolean(item.skill || item.spell)
                  )}
                />
              ) : null;
            }),
          ],
        ]}
      />
    </section>
  );
}

export function UnitCatalogEntry({ keys }: { keys: UnitKey[] }) {
  const units = keys.map((key) => unitDefinitions[key]);
  const comparisons = keys.map(unitComparisonStats);
  const portraits = keys.map((key) => getUnitSprite(key));
  const bounds = previewBounds(portraits);
  const stats = Array.from(
    new Set(
      units.flatMap((unit, index) =>
        Object.keys(comparisons[index].stats).filter(
          (stat) =>
            stat in statConfig &&
            (stat in unit.stats ||
              comparisons[index].bonuses[stat as UnitStat] !== 0)
        )
      )
    )
  );
  stats.sort((a, b) => (a === "hp" ? -1 : b === "hp" ? 1 : 0));
  return (
    <section
      className="CatalogEntry"
      id={referenceId(keys[0])}
      data-catalog-unit={keys[0]}
      data-catalog-family={unitFamily(keys[0])}
    >
      <PlainTable
        headers={[
          displayName(unitFamily(keys[0])),
          ...keys.map((key) => displayName(key)),
        ]}
        rows={[
          ...[
            [
              "Sprite",
              ...keys.map((key, index) => (
                <span id={index ? referenceId(key) : undefined} data-unit={key}>
                  {key === "rotten" ? (
                    <RottenPreview />
                  ) : (
                      [
                        "tutorialBoss",
                        "ilexElite",
                        "oakBoss",
                        "wormBoss",
                        "golem",
                      ] as UnitKey[]
                    ).includes(key) ? (
                    <BossDiagram unit={key} />
                  ) : key === "golemLimb" ? (
                    <Pixels rows={[[portraits[index]]]} label="Golem limb" />
                  ) : (
                    <LargePreview
                      unit={{ sprite: portraits[index] }}
                      bounds={bounds}
                    />
                  )}
                </span>
              )),
            ],
          ],
          [
            "Faction",
            ...units.map((unit) => <FactionLabel faction={unit.faction} />),
          ],
          ...stats.map((stat) => [
            <StatLabel stat={stat as keyof DisplayStats} />,
            ...comparisons.map(({ stats }) => {
              const value = stats[stat as keyof typeof stats];
              return value === undefined ? null : (
                <StatLabel stat={stat as keyof DisplayStats} value={value} />
              );
            }),
          ]),
          [
            "Damage",
            ...comparisons.map(({ attacks }) =>
              !attacks.some((attack) =>
                (
                  [
                    "melee",
                    "magic",
                    "true",
                    "burn",
                    "freeze",
                    "drain",
                    "heal",
                  ] as const
                ).some((stat) => attack[stat])
              ) ? null : (
                <div className="CatalogLines">
                  {attacks.flatMap((attack, index) =>
                    (
                      [
                        "melee",
                        "magic",
                        "true",
                        "burn",
                        "freeze",
                        "drain",
                        "heal",
                      ] as const
                    )
                      .filter((stat) => attack[stat])
                      .map((stat) => (
                        <div key={index + stat}>
                          <StatLabel stat={stat} value={attack[stat]} />
                        </div>
                      ))
                  )}
                </div>
              )
            ),
          ],
          [
            "Behavior",
            ...units.map((unit) =>
              unit.patternNames.length ? (
                <div className="CatalogLines">
                  {unit.patternNames.map((pattern) => (
                    <div key={pattern}>
                      <Text>{displayName(pattern).replace(/_/g, " ")}</Text>
                    </div>
                  ))}
                </div>
              ) : null
            ),
          ],
          [
            "Gear",
            ...units.map((unit) =>
              unit.equipments.some((item) => item.amount !== 0) ? (
                <Parts items={unit.equipments} />
              ) : null
            ),
          ],
          [
            "Spawns",
            ...units.map((unit) =>
              unit.vanish?.cells.length ? (
                <div className="CatalogSpawns">
                  {unit.vanish.cells.map(({ cell }, index) => (
                    <div key={index}>
                      <UnitView unit={cell as UnitKey} />
                    </div>
                  ))}
                </div>
              ) : null
            ),
          ],
          [
            "Drops",
            ...units.map((unit) =>
              unit.drops.length ? (
                <div className="CatalogDrops">
                  {unit.drops
                    .filter(
                      (drop) =>
                        drop.chance && drop.items.some((item) => item.amount)
                    )
                    .map((drop, index) => (
                      <Frame
                        key={index}
                        label={`${drop.chance}%`}
                        title={`${drop.chance}%`}
                        className="DropDialog"
                        compact
                      >
                        <Parts items={drop.items} />
                      </Frame>
                    ))}
                </div>
              ) : null
            ),
          ],
        ]}
      />
    </section>
  );
}
