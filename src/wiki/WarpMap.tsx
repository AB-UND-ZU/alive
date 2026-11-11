import { useContext, useState } from "react";
import { createAreaWorld } from "../testing/harness";
import { getWarpMap, getWarpSelection } from "../game/assets/warp";
import { overlay } from "../game/assets/pixels";
import { levelConfig } from "../game/levels";
import { LevelName } from "../engine/components/level";
import { portal, portalVortex } from "../game/assets/sprites";
import { colors } from "../game/assets/colors";
import "./WorldMap.css";
import { ReferenceContext } from "./references";
import { LargePreview } from "./LargePreview";
import { Pixels, PlainTable, Text, Literal } from "./visuals";

export function portalMap(
  selected: LevelName = "LEVEL_TUTORIAL",
  current: LevelName = "LEVEL_MENU"
) {
  const world = createAreaWorld("|♀∩|", { level: current });
  const portal = world.getEntities(["WARPABLE", "POPUP"])[0];
  portal.POPUP.horizontalIndex = portal.POPUP.tabs.indexOf("warp");
  portal.POPUP.verticalIndezes[portal.POPUP.horizontalIndex] =
    levelConfig[selected].mapOffsetY;
  return { world, portal };
}

export function completePortalMap() {
  const { world, portal } = portalMap();
  const base = getWarpMap(world, portal).background;
  return overlay(
    base,
    ...(Object.keys(levelConfig) as LevelName[]).map((level) =>
      getWarpSelection(level, colors.lime)
    )
  );
}

export function LevelMap({ level }: { level: LevelName }) {
  const [{ world, portal }] = useState(() =>
    portalMap(level, level === "LEVEL_ISLAND" ? "LEVEL_TUTORIAL" : "LEVEL_MENU")
  );
  const rows = getWarpMap(world, portal).content.slice(
    levelConfig[level].mapOffsetY,
    levelConfig[level].mapOffsetY + 5
  );
  return <Pixels rows={rows} label={levelConfig[level].name + " portal map"} />;
}

export function WarpMap() {
  const [rows] = useState(completePortalMap);
  const { features = {}, link } = useContext(ReferenceContext);
  const levelLink = (level: LevelName) => {
    const name = levelConfig[level].name;
    return features[name.toLowerCase()] ? (
      link(
        features[name.toLowerCase()].href,
        <Text>{name}</Text>,
        true
      )
    ) : (
      <Text>{name}</Text>
    );
  };
  return (
    <div className="InterfaceScroll WarpMap">
      <div className="WorldMapContent">
        <Pixels
          rows={rows}
          label="Native portal world map with all level frames"
        />
        <PlainTable
          headers={["Level", "Size", "Exit"]}
          rows={(
            Object.entries(levelConfig) as [
              LevelName,
              (typeof levelConfig)[LevelName]
            ][]
          ).map(([level, config]) =>
            [
              levelLink(level),
              <Literal>{String(config.size)}</Literal>,
              config.warps.length ? (
                config.warps.map((destination) => (
                  <div key={destination}>{levelLink(destination)}</div>
                ))
              ) : (
                <Text>No onward portal</Text>
              ),
            ].map((content, column) => (
              <div
                key={column}
                data-warp-level={level}
                style={{
                  height:
                    (getWarpSelection(level, colors.lime).length -
                      config.mapOffsetY) *
                    32,
                }}
              >
                {content}
              </div>
            ))
          )}
        />
      </div>
    </div>
  );
}
export function PortalPreview() {
  return <LargePreview unit={{ sprite: portal, backdrop: portalVortex }} />;
}
