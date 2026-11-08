import { useContext } from "react";
import { Resource } from "../engine/components/harvestable";
import { Item } from "../engine/components/item";
import { UnitKey } from "../game/balancing/units";
import { levelConfig } from "../game/levels";
import { obtainedFrom, Acquisition } from "./itemSources";
import { displayName } from "./catalog";
import {
  Frame,
  ItemView,
  Text,
  UnitView,
  Pixels,
  StatLabel,
  Count,
} from "./visuals";
import {
  ReferenceLink,
  featureSprites,
  ReferenceContext,
  MentionStyle,
} from "./references";
import { CellReference, HarvestTarget } from "./CellReference";

export function AcquisitionSources({ item }: { item: Partial<Item> }) {
  const { features = {}, link } = useContext(ReferenceContext);
  const groups = new Map<string, Acquisition[]>();
  for (const source of obtainedFrom(item)) {
    const kind =
      source.kind === "naturalUnit"
        ? "natural"
        : source.kind === "shopNpc"
        ? "shops"
        : source.kind === "world"
        ? "levels"
        : source.kind;
    groups.set(kind, [...(groups.get(kind) || []), source]);
  }
  return (
    <div className="CatalogSources">
      {[...groups].map(([kind, sources]) => {
        if (["crafting", "forging", "brewing"].includes(kind))
          return (
            <div key={kind}>
              {sources.map((source, index) => (
                <Frame
                  compact
                  title={displayName(kind)}
                  key={index}
                  className="RecipeSource"
                >
                  {source.parts!.map((part, i) => (
                    <div key={i}>
                      <ItemView item={part} amount />
                    </div>
                  ))}
                </Frame>
              ))}
            </div>
          );
        return (
          <div key={kind}>
            <Frame
              compact
              title={displayName(kind)}
              className={kind === "drop" ? "DropDialog" : ""}
            >
              {sources.map((source, index) => {
                if (source.kind === "shops" || source.kind === "shopNpc")
                  return (
                    <div key={index}>
                      {source.key && (
                        <div>
                          <UnitView unit={source.key as UnitKey} />
                        </div>
                      )}
                      {source.buy?.map((price, i) => (
                        <div key={`buy-${i}`}>
                          <ItemView item={price} amount />
                          <Text> (Buy)</Text>
                        </div>
                      ))}
                      {source.sell?.map((price, i) => (
                        <div key={`sell-${i}`}>
                          <ItemView item={price} amount />
                          <Text> (Sell)</Text>
                        </div>
                      ))}
                    </div>
                  );
                if (source.kind === "world") {
                  const name = levelConfig[source.level!].name;
                  const content = (
                    <MentionStyle preserveColor>
                      <span className="Item">
                        <Pixels rows={[[featureSprites.levels]]} />
                        <Text>
                          {name +
                            (source.biome
                              ? ` (${displayName(source.biome)})`
                              : "")}
                        </Text>
                      </span>
                    </MentionStyle>
                  );
                  return (
                    <div key={index}>
                      {features.levels
                        ? link(
                            features.levels.href + "#" + name.toLowerCase(),
                            content,
                            true
                          )
                        : content}
                    </div>
                  );
                }
                if (source.kind === "fishing")
                  return (
                    <div key={index}>
                      <StatLabel stat="fishing" value={source.fishingLevel} />
                      <Text> </Text>
                      <Count value={source.chance!} />
                      <Text>%</Text>
                    </div>
                  );
                return (
                  <div key={index}>
                    {source.kind === "drop" && source.key === "rotten" ? (
                      <CellReference cell="rotten_stem_right" />
                    ) : source.kind === "drop" ||
                      source.kind === "quest" ||
                      source.kind === "naturalUnit" ? (
                      <UnitView unit={source.key as UnitKey} />
                    ) : source.kind === "harvest" ? (
                      <HarvestTarget resource={source.key as Resource} />
                    ) : source.kind === "natural" ? (
                      <CellReference cell={source.key!} />
                    ) : source.kind === "collect" ? (
                      <>
                        <Text>Unarmed: </Text>
                        <ItemView item={{ stackable: "stick" }} />
                      </>
                    ) : source.kind === "refill" ? (
                      <CellReference cell="water" />
                    ) : (
                      <ReferenceLink name="damage">
                        <Text>Contact attacks</Text>
                      </ReferenceLink>
                    )}
                  </div>
                );
              })}
            </Frame>
          </div>
        );
      })}
    </div>
  );
}
