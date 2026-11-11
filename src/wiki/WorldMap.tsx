import snapshot from "./island.json";
import { WorldDiagram } from "./WorldDiagram";
import { Sprite } from "../engine/components/sprite";
import { colors } from "../game/assets/colors";
import { mapFortress, mapHouse, mapSpawn } from "../game/assets/sprites";
import { Pixels, Text, Literal, UnitView } from "./visuals";
import { useContext } from "react";
import { ReferenceContext, MentionStyle } from "./references";
import { levelConfig } from "../game/levels";
import "./WorldMap.css";

const rows = snapshot.overview.map((row) =>
  row.map((index) => snapshot.sprites[index])
);

export function WorldMap() {
  const { features = {}, link } = useContext(ReferenceContext);
  const mention = (
    sprite: Sprite,
    title: string,
    feature: string,
    anchor = ""
  ) => (
    <div>
      <Pixels rows={[[sprite]]} />
      {features[feature] ? (
        link(
          features[feature].href + anchor,
          <MentionStyle preserveColor>
            <Text color={colors.grey}>{title}</Text>
          </MentionStyle>,
          true
        )
      ) : (
        <Text>{title}</Text>
      )}
    </div>
  );
  return (
    <div className="InterfaceScroll WorldMap">
      <div className="WorldMapContent">
        <Pixels
          rows={rows}
          label={`Generated Island map, seed ${snapshot.seed}, fully revealed`}
        />
        <div className="WorldMapLegend">
          <div>
            <Literal>{`${levelConfig.LEVEL_ISLAND.size} x ${levelConfig.LEVEL_ISLAND.size}; seed ${snapshot.seed}`}</Literal>
          </div>
          <div>
            <UnitView unit="ilexElite" />
          </div>
          <div>
            <UnitView unit="oakBoss" />
          </div>
          {mention(mapSpawn, "Start", "respawn")}
          {mention(mapHouse, "Earth Town", "island", "#earth-town")}
          {mention(mapFortress, "Fire Haven", "island", "#fire-haven")}
          <div>
            <UnitView unit="fireNomad" />
          </div>
        </div>
      </div>
    </div>
  );
}

const townRoles: Record<string, string> = {
  earthChief: "Talk about Earth Town's quests.",
  earthGuard: "Speak at the town entrances.",
  earthSmith: "Unlock forging with the smith.",
  earthDruid: "Unlock brewing with the druid.",
  earthTrader: "Buy and sell goods.",
  fireChief: "Talk about Fire Haven's quests.",
  fireGateGuard: "Speak at the haven gate.",
  fireJettyGuard: "Speak to the guard at the jetty.",
  fireSmith: "Forge equipment with the smith.",
  fireDruid: "Brew potions with the druid.",
  fireTrader: "Buy and sell goods.",
  chick: "Town animal.",
  goldPrism: "Hostile creature; fight it.",
  golem: "Hostile creature near the haven.",
};
const stations: Record<string, string> = {
  Bench: "Craft equipment.",
  Anvil: "Forge equipment once unlocked.",
  Kettle: "Brew potions once unlocked.",
};
const interactions: Record<string, string> = {
  craft: "Craft equipment.",
  forge: "Forge equipment.",
  brew: "Brew potions.",
  buy: "Buy goods.",
  sell: "Sell goods.",
  info: "Read the sign or speak when prompted.",
  quest: "Speak about quests.",
};
export function TownMap({ town }: { town: "earth" | "fire" }) {
  const sample = snapshot[town];
  const name = town === "earth" ? "Earth Town" : "Fire Haven";
  return (
    <section
      className={`TownMap${sample.bounds.width > 32 ? " TownMapCompact" : ""}`}
      data-town={town}
    >
      <WorldDiagram
        rows={sample.rows.map((row) =>
          row.map((index) => snapshot.sprites[index])
        )}
        label={`${name}, seed ${snapshot.seed}, all buildings shown from inside`}
      />
      <dl
        className="TownLegend"
        aria-label={`${name} interactions and residents`}
      >
        {sample.legend.map((entry) => (
          <div key={entry.unit || entry.name}>
            <dt className="TownLegendUnit">
              <Pixels rows={[[snapshot.sprites[entry.sprite]]]} />
              <Text>
                {entry.name + (entry.count > 1 ? ` x${entry.count}` : "")}
              </Text>
            </dt>
            <dd>
              <Text>
                {(entry.unit && townRoles[entry.unit]) ||
                  (entry.lock
                    ? "Open when prompted; some locks need a matching key."
                    : "") ||
                  stations[entry.name] ||
                  entry.tabs
                    .map((tab) => interactions[tab])
                    .filter(Boolean)
                    .join(" ") ||
                  "Interact when the game shows a prompt."}
              </Text>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
