import { RewardContainers } from "./CatalogEntry";
import { SpriteGallery } from "./SpriteGallery";
import { getWikiUnitSprite } from "./catalog";
import { TownMap } from "./WorldMap";
import { StructureOverview } from "./StructureOverview";
import { Minimap } from "./Minimap";
import { FarmingProgression } from "./FarmingProgression";
import { Sounds } from "./Sounds";
import { WarpMap, PortalPreview } from "./WarpMap";
import { Literal, TableContext } from "./visuals";
import { Damage } from "./Damage";
import { CellReference, HarvestTarget } from "./CellReference";
import { Resource } from "../engine/components/harvestable";
import { WorldPlants, worldPlantGroups } from "./WorldPlants";
import {
  mergeSprites,
  statConfig,
  Stats as DisplayStats,
} from "../game/assets/ui";
import {
  Parts,
  FactionLabel,
  ItemCatalogEntry,
  UnitCatalogEntry,
} from "./CatalogEntry";
import { Sprite } from "../engine/components/sprite";
import { LargePreview, previewBounds } from "./LargePreview";
import {
  itemPage,
  itemCategory,
  unitPage,
  displayName,
  previewItem,
  catalogItems,
  unitName,
  unitGroups,
  unitFamily,
  fishItems,
  itemVariants,
  itemCatalogFamilies,
  itemOverviewGroup,
  unitOverviewGroup,
  getEffectSprite,
  isWikiUnit,
} from "./catalog";
import { tribes, enemies, neutrals } from "../engine/components/belongable";
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
import { isFriendlyFire } from "../engine/systems/damage";
import { unitDefinitions } from "../game/balancing/units";
import { UnitKey } from "../game/balancing/units";
import {
  referenceId,
  ReferenceText,
  ReferenceContext,
  MentionStyle,
  ReferenceLink,
} from "./references";
import { Fragment, useContext, useState } from "react";
import { commandItems, commandSignatures } from "../game/assets/commands";
import { craftingIngredients } from "../game/balancing/crafting";
import { brewingRecipes } from "../game/balancing/brewing";
import { getLevelStats } from "../engine/systems/leveling";
import { classDefinitions } from "../game/balancing/classes";
import { displayedClasses } from "../game/assets/pixels";
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
import { unitStats, UnitStat } from "../engine/components/stats";
import { Item, elements } from "../engine/components/item";
import { gearStats } from "../game/balancing/equipment";
import { abilityStats } from "../game/balancing/abilities";
import { slots, equipments } from "../engine/components/equippable";
import { getItemSprite } from "../game/assets/utils";
import { getItemDescription } from "../game/assets/descriptions";
import "./catalog.css";

import { colors } from "../game/assets/colors";
import {
  missing,
  ghost,
  halo,
  tombstone1,
  kills,
  aura,
  woodStickAir2,
} from "../game/assets/sprites";
import {
  Frame,
  StatLabel,
  SlotLabel,
  Input,
  ItemView,
  Pixels,
  PlainTable,
  Text,
  textSprites,
} from "./visuals";
const equipmentStatDescriptions: Record<
  Exclude<keyof DisplayStats, UnitStat>,
  string
> = {
  melee: "Contact or skill damage before Power and Armor.",
  magic: "Spell damage before Wisdom and Resist.",
  true: "Damage that ignores Power, Wisdom, Armor and Resist.",
  burn: "Burn applied by a hit; Damp reduces its damage.",
  freeze: "Freeze applied by a hit; Thaw shortens its duration.",
  heal: "Health restored to a friendly target, increased by Wisdom.",
  drain: "Health restored to the attacker when the effect hits.",
  absorb: "Strength of the defensive block.",
  duration: "Effect duration; each ability uses its own sequence timing.",
  range: "Reach or target count, depending on the spell, skill or tool.",
  retrigger: "Gap before the next activation or repeated hit.",
  reproc: "Gap before the same drain or knock effect can apply again.",
  knock: "Knockback applied to the target.",
  addPower: "Temporary Power granted by an aura.",
  addWisdom: "Temporary Wisdom granted by an aura.",
  addArmor: "Temporary Armor granted by an aura.",
  addResist: "Temporary Resist granted by an aura.",
  addHaste: "Temporary Haste granted by an aura.",
  logging: "Tool strength for chopping. See Harvesting.",
  mining: "Tool strength for mining. See Harvesting.",
  fishing: "Tool level used for the catch distribution. See Fishing.",
  farming: "Tool level used for digging and planting. See Farming.",
  build: "Highest supported construction level. See Building.",
};
type CatalogIndexEntry = {
  key: string;
  sprite: Sprite;
  color?: string;
  redirected?: boolean;
  kind?: "item" | "unit";
  group?: string;
};
function CatalogIndex({ entries }: { entries: CatalogIndexEntry[] }) {
  const {
    link,
    entries: references,
    route: pageRoute,
  } = useContext(ReferenceContext);
  if (!entries.length) return null;
  const groups = new Map<string, CatalogIndexEntry[]>();
  for (const entry of entries) {
    const group = entry.group || "";
    groups.set(group, [...(groups.get(group) || []), entry]);
  }
  const grouped = groups.size > 1;
  const cellWidth = Math.max(
    8,
    ...entries.map((entry) => entry.sprite.name.length + 3),
    ...[...groups.keys()].map((group) => displayName(group).length + 2)
  );
  const count = grouped
    ? Math.min(groups.size, 4)
    : [1, 2, 3, 4].reduce((best, columns) => {
        const difference = (value: number) =>
          Math.abs(
            (value * cellWidth + 2) * 18 -
              (Math.ceil(entries.length / value) + 2) * 32
          );
        return difference(columns) < difference(best) ? columns : best;
      }, 1);
  const renderEntry = ({
    key,
    sprite,
    color = colors.grey,
    redirected,
    kind,
  }: CatalogIndexEntry) => {
    const reference = references[kind ? `${kind}:${key}` : key];
    const target =
      reference && reference.kind !== "code" && reference.kind !== "type"
        ? reference.href
        : `#${referenceId(key)}`;
    const [route, anchor] = target.split("#");
    const href =
      !route || route === pageRoute ? `#${anchor || referenceId(key)}` : target;
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
  };
  return (
    <Frame
      className="CatalogOverview"
      label="Catalog index"
      title="Contents"
      color={colors.green}
      titleBackground={colors.green}
      columns={count * cellWidth + count - 1 + 2}
    >
      <div
        className={`CatalogIndex${grouped ? " CatalogGrouped" : ""}`}
        aria-label="Catalog index"
        style={{
          gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${
            cellWidth * 18
          }px), 1fr))`,
        }}
      >
        {grouped
          ? [...groups].map(([group, members]) => (
              <div className="CatalogGroup" key={group}>
                <Text color={colors.white}>{displayName(group)}</Text>
                {members.map(renderEntry)}
              </div>
            ))
          : entries.map(renderEntry)}
      </div>
    </Frame>
  );
}

function ResponsiveData() {
  const [dimensions, setDimensions] = useState(initialDimensions);
  useResizeListener(setDimensions);
  return (
    <PlainTable
      headers={["Viewport / layout", "Current value"]}
      rows={[
        [
          "Screen",
          <Literal>{`${dimensions.screenWidth} x ${dimensions.screenHeight}`}</Literal>,
        ],
        [
          "Character",
          <Literal>{`${dimensions.cellWidth} x ${dimensions.cellHeight}`}</Literal>,
        ],
        [
          "Columns / rows",
          <Literal>{`${dimensions.columns} / ${dimensions.rows}`}</Literal>,
        ],
        [
          "Minimum visible columns",
          <Literal>{String(dimensions.visibleColumns)}</Literal>,
        ],
        ["HUD rows", <Literal>{String(dimensions.hudRows)}</Literal>],
        [
          "Terminal",
          <Literal>{`${
            dimensions.terminalWidth
          } x ${dimensions.terminalHeight.toFixed(2)}`}</Literal>,
        ],
      ]}
    />
  );
}
export function TimerData() {
  const [world] = useState(createWorld);
  return (
    <PlainTable
      headers={["Clock", "Interval"]}
      rows={[
        [
          "World reference",
          <Literal>{`${getHasteInterval(world, -1)} ms`}</Literal>,
        ],
        ...[-1, 0, 1, 2, 3, 4, 5].map((haste) => [
          <span>
            <TableContext.Provider value={false}>
              <StatLabel stat="haste" value={haste} />
            </TableContext.Provider>
          </span>,
          <Literal>{`${getHasteInterval(world, haste)} ms`}</Literal>,
        ]),
        ["Systems update", <Literal>30 updates / second</Literal>],
        ["Sequence", "Elapsed milliseconds since creation"],
      ]}
    />
  );
}
export function Widget({ name }: { name: string }) {
  const [search, setSearch] = useState("");
  const [kind, category] = name.split(" ");
  if (name === "structure-overview") return <StructureOverview />;
  if (name === "equipment-stats")
    return (
      <PlainTable
        headers={["Stat", "Effect"]}
        rows={[
          ...Object.entries(equipmentStatDescriptions)
            .filter(([key]) => !key.startsWith("add"))
            .map(([key, description]) => {
              const stat = key as keyof DisplayStats;
              return [
                <span id={"stat-" + referenceId(stat)}>
                  {statConfig[stat].sprite.layers.length ? (
                    <StatLabel stat={stat} />
                  ) : (
                    <Text>
                      {stat === "reproc" ? "Proc Delay" : displayName(stat)}
                    </Text>
                  )}
                </span>,
                <ReferenceText text={description} />,
              ];
            }),
          [
            <ReferenceLink name="aura" sprite>
              <span className="Item" id="aura">
                <Pixels rows={[[aura]]} label="Aura" />
                <Text color={colors.white}>Aura</Text>
              </span>
            </ReferenceLink>,
            <div className="CatalogLines">
              {Object.keys(equipmentStatDescriptions)
                .filter((key) => key.startsWith("add"))
                .map((key) => (
                  <div key={key} id={"stat-" + referenceId(key)}>
                    <StatLabel stat={key as keyof DisplayStats} />
                  </div>
                ))}
            </div>,
          ],
        ]}
      />
    );
  if (name === "stats")
    return (
      <PlainTable
        headers={["Stat", "Effect"]}
        rows={unitStats.map((stat) => [
          <span id={"stat-" + referenceId(stat)}>
            <StatLabel stat={stat} />
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
  if (name === "earth-town-map") return <TownMap town="earth" />;
  if (name === "fire-haven-map") return <TownMap town="fire" />;
  if (name === "levels") return <WarpMap />;
  if (name === "portal") return <PortalPreview />;
  if (name === "minimap") return <Minimap />;
  if (name === "sounds") return <Sounds />;
  if (name === "factions") {
    const factions = [...tribes, ...enemies, ...neutrals];
    const world = createWorld();
    return (
      <>
        <p>
          <Pixels rows={[[kills]]} label="Hit" />
          <Text> Hit. Rows attack columns; blank cells cannot hit.</Text>
        </p>
        <PlainTable
          headers={[
            "Hit",
            ...factions.map((faction) => <FactionLabel faction={faction} />),
          ]}
          rows={factions.map((source) => [
            <span id={referenceId(source)}>
              <FactionLabel faction={source} />
            </span>,
            ...factions.map((target) =>
              isFriendlyFire(
                world,
                { BELONGABLE: { faction: source } },
                { BELONGABLE: { faction: target } }
              ) ? null : (
                <Pixels
                  rows={[[kills]]}
                  label={`${displayName(source)} to ${displayName(target)}: ${
                    isFriendlyFire(
                      world,
                      { BELONGABLE: { faction: source } },
                      { BELONGABLE: { faction: target } }
                    )
                      ? "No hit"
                      : "Hit"
                  }`}
                />
              )
            ),
          ])}
        />
      </>
    );
  }
  if (name === "respawn")
    return (
      <Frame label="RESPAWN.TXT" title="RESPAWN.TXT" columns={35}>
        <div className="CatalogLines">
          <div>
            <StatLabel stat="hp" value={0} />
            <Text> → </Text>
            <Pixels rows={[[tombstone1]]} label="Grave" />
            <Text> Grave + unbound items</Text>
          </div>
          <div>
            <Text> ↓</Text>
          </div>
          <div>
            <Pixels rows={[[ghost]]} label="Soul" />
            <Text> Return to spawn</Text>
          </div>
          <div>
            <Text> ↓</Text>
          </div>
          <div>
            <Pixels rows={[[halo]]} label="Halo" />
            <Text> Respawn → </Text>
            <Pixels rows={[[classDefinitions.rogue.sprite]]} label="Hero" />
          </div>
          <div>
            <Text> ↓</Text>
          </div>
          <div>
            <Text>Follow marker to </Text>
            <Pixels rows={[[tombstone1]]} label="Grave" />
            <Text> Grave</Text>
          </div>
        </div>
      </Frame>
    );
  if (name === "terrain")
    return (
      <PlainTable
        headers={["Ground", "Effect"]}
        rows={[
          [<CellReference cell="air" />, "Open ground"],
          [<CellReference cell="snow" />, "Snow-covered ground"],
          [<CellReference cell="rubble" />, "Broken stone"],
          [<CellReference cell="soil" />, "Plant seeds after watering"],
          [<CellReference cell="soil_wet" />, "Watered planting ground"],
          [<CellReference cell="path" />, "Faster movement"],
          [<CellReference cell="sand" />, "Slower movement"],
          [<CellReference cell="beach" />, "Shore beside water"],
          [
            <CellReference cell="water_shallow" />,
            "Wade near land; slowed; extinguishes fire",
          ],
          [
            <CellReference cell="water_deep" />,
            "Blocks walking away from shore; cross with a boat",
          ],
          [
            <CellReference cell="ice" />,
            "Slide until leaving ice or hitting an obstacle",
          ],
          [<CellReference cell="mountain" />, "Blocks movement and sight"],
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
  if (name === "reward-containers") return <RewardContainers />;
  if (name === "sprite-gallery") return <SpriteGallery />;
  if (name === "sprite-layers")
    return (
      <>
        <LargePreview unit={{ sprite: woodStickAir2 }} />
        <PlainTable
          headers={["Layer", "Meaning"]}
          rows={[
            ["Character", "Glyph from the bundled font"],
            ["Color", "One of the game palette colors"],
            ["Facing", "Layers for each facing direction"],
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
              kind: "unit",
              sprite: { ...getWikiUnitSprite("chick"), name: "Chick" },
            },
            {
              key: "worm",
              kind: "item",
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
  if (name === "element-effects")
    return (
      <PlainTable
        headers={[
          "Element",
          <Text>{"Sword\nEffect"}</Text>,
          <Text>{"Shield\nEffect"}</Text>,
          <Text>{"Spell\nEffect"}</Text>,
        ]}
        rows={elements.map((element) => [
          <ItemView item={commandItems[element]} />,
          <div className="CatalogLines">
            {Object.entries(
              gearStats.default?.sword?.wood?.[element] || {}
            ).map(([stat, value]) => (
              <div key={stat}>
                <StatLabel stat={stat as keyof DisplayStats} value={value} />
              </div>
            ))}
          </div>,
          <div className="CatalogLines">
            {Object.entries(
              gearStats.default?.shield?.wood?.[element] || {}
            ).map(([stat, value]) => (
              <div key={stat}>
                <StatLabel stat={stat as keyof DisplayStats} value={value} />
              </div>
            ))}
          </div>,
          <div className="CatalogLines">
            {Array.from(
              new Set(
                Object.values(abilityStats.default || {}).flatMap((ability) =>
                  Object.keys(ability?.wood?.[element] || {})
                )
              )
            )
              .filter((stat) => stat !== "magic")
              .map((stat) => (
                <div key={stat}>
                  <StatLabel stat={stat as keyof DisplayStats} />
                </div>
              ))}
          </div>,
        ])}
      />
    );
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
              kind: "item" as const,
              group:
                itemOverviewGroup(key) ||
                (item.weapon
                  ? "Weapons"
                  : item.offhand
                  ? "Offhand"
                  : item.accessory
                  ? "Accessories"
                  : item.spell
                  ? "Spells"
                  : item.skill
                  ? "Skills"
                  : item.tool
                  ? "Tools"
                  : item.consume
                  ? "Consumables"
                  : item.stat
                  ? "Pickups"
                  : item.stackable === "resource"
                  ? item.element
                    ? "Elements"
                    : "Materials"
                  : itemCategory(item) === "consumables"
                  ? "Food"
                  : "Resources"),
              sprite: {
                ...getItemSprite(previewItem(item), "display"),
                ...(itemPage(item) === "elements"
                  ? { name: displayName(key) }
                  : {}),
              },
              redirected: Boolean(category && itemPage(item) !== category),
            }))}
        />
        {itemCatalogFamilies(category).map((group) => (
          <ItemCatalogEntry
            key={group.name}
            name={group.name}
            definition={group.entries[0].definition}
            title={group.title}
            family={group.entries.length > 1 ? group.entries : undefined}
          />
        ))}
      </div>
    );
  if (name === "unit-catalog" || kind === "units") {
    const keys = (Object.keys(unitDefinitions) as UnitKey[]).filter(
      (key) =>
        (!category || unitPage(key, unitDefinitions[key]) === category) &&
        !(
          category === "containers" &&
          /chest/i.test(key) &&
          !/^(wood|iron|gold|diamond|ruby)Chest$/.test(key)
        )
    );
    const groups = unitGroups(keys);
    return (
      <div>
        <CatalogIndex
          entries={[
            ...(category === "plants"
              ? worldPlantGroups().map((family) => ({
                  key: "world-" + family.name.toLowerCase(),
                  group: family.name === "Palm" ? "Desert" : "Forest",
                  sprite: { ...family.plants[0].sprites[0], name: family.name },
                  color: colors.grey,
                }))
              : []),
            ...groups
              .filter(
                (group) =>
                  category !== "enemies" || unitFamily(group[0]) !== "hedge"
              )
              .map((group) => {
                const key = group[0],
                  unit = unitDefinitions[key];
                return {
                  key,
                  kind: "unit" as const,
                  group:
                    category === "plants"
                      ? unitFamily(key) === "cactus"
                        ? "Desert"
                        : "Forest"
                      : category === "enemies"
                      ? unitOverviewGroup(key)
                      : unitPage(key, unit),
                  redirected: Boolean(
                    category && unitPage(key, unit) !== category
                  ),
                  sprite: {
                    ...getWikiUnitSprite(key),
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
              }),
          ]}
        />
        {category === "plants" && <WorldPlants />}
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
  if (name === "world-plants") return <WorldPlants />;
  if (name === "damage") return <Damage />;
  if (name === "classes") {
    const portraits = displayedClasses.map((key) =>
      mergeSprites(
        classDefinitions[key].backdrop || { name: "", layers: [] },
        classDefinitions[key].sprite
      )
    );
    const levels = Array.from({ length: 10 }, (_, index) => index + 1);
    return (
      <PlainTable
        headers={[
          "Class",
          ...displayedClasses.map((key) =>
            key === "???" ? key : displayName(key)
          ),
        ]}
        rows={[
          [
            "Sprite",
            ...displayedClasses.map((key, index) => (
              <span id={referenceId(key) || "unknown-class"}>
                <LargePreview
                  unit={{ sprite: portraits[index] }}
                  bounds={previewBounds(portraits)}
                />
              </span>
            )),
          ],
          [
            "Extra stats",
            ...displayedClasses.map((key) => (
              <div className="CatalogLines">
                {(
                  [
                    "power",
                    "wisdom",
                    "armor",
                    "resist",
                    "haste",
                    "vision",
                    "damp",
                    "thaw",
                    "spike",
                  ] as const
                )
                  .filter((stat) => classDefinitions[key].stats[stat])
                  .map((stat) => (
                    <div className="ClassExtraStat" key={stat}>
                      <Text color={statConfig[stat].color}>+</Text>
                      <StatLabel
                        stat={stat}
                        value={classDefinitions[key].stats[stat]}
                      />
                    </div>
                  ))}
              </div>
            )),
          ],
          [
            <div className="ClassProgression">
              <Text color={colors.lime}>Level</Text>
              {levels.map((level) => (
                <Text key={level} color={colors.lime}>
                  {"#" + level}
                </Text>
              ))}
            </div>,
            ...displayedClasses.map((key) => (
              <div className="ClassProgression">
                <Pixels rows={[textSprites("       ")]} />
                {levels.map((level) => {
                  const stats = getLevelStats(key, level);
                  return (
                    <div className="ClassLevel" key={level}>
                      {(["hp", "mp"] as const).map((stat) => (
                        <Fragment key={stat}>
                          {stat === "mp" && <Text continuous> </Text>}
                          <ReferenceLink name={"stat:" + stat} sprite>
                            <Pixels
                              rows={[
                                [
                                  ...textSprites(
                                    String(
                                      stat === "hp" ? stats.maxHp : stats.maxMp
                                    ).padStart(2, " "),
                                    statConfig[stat].color
                                  ),
                                  statConfig[stat].sprite,
                                ],
                              ]}
                            />
                          </ReferenceLink>
                        </Fragment>
                      ))}
                    </div>
                  );
                })}
              </div>
            )),
          ],
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
        headers={["Structure", "Parts", "Building", "Work", "Ground"]}
        rows={buildConstructions.map((p) => [
          <ReferenceLink
            name={(() => {
              const cell = p.variants[0].cell.replace(/_/g, "").toLowerCase();
              const unit = (Object.keys(unitDefinitions) as UnitKey[]).find(
                (key) => isWikiUnit(key) && key.toLowerCase() === cell
              );
              return unit ? "unit:" + unit : p.sprite.name.toLowerCase();
            })()}
            sprite
          >
            <span
              id={"plan-" + referenceId(p.variants[0].cell)}
              className="Item"
              style={{ gap: 0 }}
            >
              <Pixels rows={[[p.sprite]]} label={p.sprite.name} />
              <Text color={colors.grey}>
                {displayName(p.sprite.name || p.variants[0].cell)}
              </Text>
            </span>
          </ReferenceLink>,
          <Parts items={p.parts} />,
          <StatLabel stat="build" value={p.level} showName={false} />,
          String(p.effort),
          <div className="CatalogLines">
            {p.grounds.map((cell) => (
              <div key={cell}>
                <CellReference cell={cell} />
              </div>
            ))}
          </div>,
        ])}
      />
    );
  if (name === "harvesting")
    return (
      <PlainTable
        headers={["Target", "Tool", "Work", "Drops"]}
        className="HarvestingTable"
        columnLimits={[14]}
        rows={Object.entries(harvestTools).map(([key, tool]) => {
          const resource = key as Resource;
          const data = getHarvestConfig(resource);
          return [
            <HarvestTarget resource={resource} />,
            <ItemView item={{ tool, material: "wood" }} />,
            String(data.harvestable.maximum),
            <Parts items={data.yields} />,
          ];
        })}
      />
    );
  if (name === "farming-progression") return <FarmingProgression />;
  if (name === "farming")
    return (
      <PlainTable
        headers={["Plant", "Result", "World ticks"]}
        rows={Object.entries(plantConfigs).map(([key, c]) => [
          <ItemView item={{ stackable: key as Item["stackable"] }} />,
          c.crop ? (
            <ItemView item={c.crop} />
          ) : c.cell === "hedge" || c.cell === "cactus" ? (
            <HarvestTarget resource={c.cell} />
          ) : (
            <CellReference cell={c.cell!} />
          ),
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
          <StatLabel
            stat={v.countable}
            value={v.amount}
            percentage={v.percentage}
          />,
        ])}
      />
    );
  if (name === "forging")
    return (
      <PlainTable
        headers={["Base", "Add", "Result"]}
        rows={Array.from(
          new Map(
            Object.values(catalogItems)
              .flatMap((item) =>
                itemVariants(item)
                  .filter((variant) => !variant.element)
                  .flatMap((variant) =>
                    getForgeOptions({
                      ...variant,
                      amount: 1,
                      carrier: 0,
                      bound: false,
                    })
                  )
              )
              .map((option) => [
                JSON.stringify([option.base, option.result]),
                option,
              ])
          ).values()
        ).map((v) => [
          <ItemView item={v.base} />,
          <ItemView item={v.add} amount />,
          <ItemView item={v.result} />,
        ])}
      />
    );
  if (name === "items")
    return (
      <div>
        <Input label="Search items" value={search} onChange={setSearch} />
        <div className="ItemIndex">
          {Object.keys(commandItems)
            .sort()
            .filter((key) => key.toLowerCase().includes(search.toLowerCase()))
            .map((key) => {
              const item = previewItem(commandItems[key]);
              const effect = getEffectSprite(item);
              const supported =
                getItemSprite(item, "display").name !== missing.name;
              return (
                <span key={key} data-item-name={key}>
                  {effect ? (
                    <Parts items={[item]} />
                  ) : supported ? (
                    <ItemView item={item} />
                  ) : null}
                  <div>
                    <Text>{key}</Text>
                  </div>
                </span>
              );
            })}
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
