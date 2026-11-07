import { getItemConsumption } from "../engine/systems/consume";
import {
  statConfig,
  getStatColor,
  Stats as DisplayStats,
} from "../game/assets/ui";
import { Item } from "../engine/components/item";
import { Sprite } from "../engine/components/sprite";
import { UnitKey, unitDefinitions } from "../game/balancing/units";
import { colors } from "../game/assets/colors";
import { getItemDescription } from "../game/assets/descriptions";
import {
  getItemConfig,
  getItemSprite,
  getUnitSprite,
} from "../game/assets/utils";
import { getItemStats } from "../game/balancing/equipment";
import {
  referenceId,
  ReferenceText,
  ReferenceLink,
  MentionStyle,
} from "./references";
import { Pixels, PlainTable, Text, StatLabel } from "./visuals";
import { LargePreview } from "./LargePreview";
import {
  displayName,
  itemVariants,
  unitFamily,
  getEffectSprite,
  previewItem,
} from "./catalog";
import { ItemView } from "./visuals";

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
                    <Text color={colors.grey} link={false}>
                      {String(item.amount ?? 1)}
                    </Text>
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
  const runs: { text?: string; color?: string; sprite?: Sprite }[] = [];
  for (const cell of content) {
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
        text !== undefined ? { text, color } : { sprite: cell as Sprite }
      );
  }
  return (
    <p className="CatalogDescription">
      <MentionStyle preserveColor>
        {runs.map((run, index) =>
          run.sprite ? (
            <ReferenceLink key={index} name={run.sprite.name} sprite>
              <Pixels rows={[[run.sprite]]} label={run.sprite.name} />
            </ReferenceLink>
          ) : (
            <ReferenceText
              key={index}
              text={run.text!}
              color={run.color}
              decorate={false}
            />
          )
        )}
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
  const consumptions = variants.map((item) =>
    getItemConsumption({
      ITEM: { ...item, amount: 1, carrier: 0, bound: false },
    })
  );
  const values = variants.map((item, index) => ({
    ...getItemStats(item),
    ...(consumptions[index]
      ? { [consumptions[index]!.countable]: consumptions[index]!.amount }
      : {}),
  }));
  const stats = Array.from(
    new Set(
      values.flatMap((value) =>
        Object.entries(value)
          .filter(([, amount]) => typeof amount === "number" && amount !== 0)
          .map(([key]) => key)
      )
    )
  );
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
                />
              </span>
            )),
          ],
          ...properties
            .filter((property) => variants.some((item) => item[property]))
            .map((property) => [
              displayName(property),
              ...variants.map((item) =>
                item[property] ? (
                  <ReferenceText text={String(item[property])} />
                ) : null
              ),
            ]),
          ...stats.map((stat) => [
            <StatLabel stat={stat as keyof ReturnType<typeof getItemStats>} />,
            ...values.map((value, index) =>
              value[stat as keyof typeof value] ? (
                <Text color={getStatColor(stat as keyof DisplayStats)}>{`${
                  value[stat as keyof typeof value]
                }${
                  consumptions[index]?.countable === stat &&
                  consumptions[index]?.percentage
                    ? "%"
                    : ""
                }`}</Text>
              ) : null
            ),
          ]),
          [
            "Info",
            ...variants.map((item) => {
              const config = getItemConfig(item);
              return config?.getDescription ||
                config?.descriptions?.[item.material || "default"]?.[
                  item.element || "default"
                ] ? (
                <CatalogDescription rows={getItemDescription(item)} />
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
  const stats = Array.from(
    new Set(
      units.flatMap((unit) =>
        Object.keys(unit.stats).filter((stat) => stat in statConfig)
      )
    )
  );
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
          [
            "Sprite",
            ...keys.map((key, index) => (
              <span id={index ? referenceId(key) : undefined} data-unit={key}>
                <LargePreview unit={{ sprite: getUnitSprite(key) }} />
              </span>
            )),
          ],
          [
            "Faction",
            ...units.map((unit) => <ReferenceText text={unit.faction} />),
          ],
          ...stats.map((stat) => [
            <StatLabel stat={stat as keyof DisplayStats} />,
            ...units.map((unit) => {
              const value = unit.stats[stat as keyof typeof unit.stats];
              return value === undefined ? null : (
                <Text color={getStatColor(stat as keyof DisplayStats)}>
                  {String(value)}
                </Text>
              );
            }),
          ]),
          [
            "Behavior",
            ...units.map((unit) =>
              unit.patternNames.length ? (
                <div className="CatalogLines">
                  {unit.patternNames.map((pattern) => (
                    <div key={pattern}>
                      <ReferenceText text={displayName(pattern)} />
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
            "Drops",
            ...units.map((unit) =>
              unit.drops.length ? (
                <div className="CatalogLines">
                  {unit.drops.map((drop, index) => (
                    <div key={index}>
                      <Text>{`${drop.chance}%`}</Text>
                      <Parts items={drop.items} />
                    </div>
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
