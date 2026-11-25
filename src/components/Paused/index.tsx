import { backdrop } from "../../game/assets/sprites";
import { isTouch, useDimensions } from "../Dimensions";
import Row from "../Row";
import "./index.css";
import { mapLoading, worldLoading } from "../../game/assets/loading";
import { levelConfig } from "../../game/levels";
import { useCallback, useContext } from "react";
import { LoadingContext, useWorld } from "../../renderers/interface/hooks";
import { repeat } from "../../game/math/std";
import { colors } from "../../game/assets/colors";
import { createText, addBackground, createButton } from "../../game/assets/ui";
import { canSave, getSaveSummaries } from "../../game/saves";
import { World as WorldType } from "../../engine";
import { Sprite } from "../../engine/components/sprite";
import { LEVEL } from "../../engine/components/level";
import { SaveStatus } from "../../renderers/interface/hooks";

const pauseButtonWidth = 8;

// name of the current game's save, same as in the saves list
const getSaveText = (ecs: WorldType, saveStatus?: SaveStatus) => {
  if (saveStatus?.saving) return createText("Saving...", colors.grey);
  if (saveStatus?.failed) return createText("Failed!", colors.red);

  const name =
    saveStatus?.name ||
    getSaveSummaries().find((save) => save.id === ecs.metadata.saveId)?.name;
  return createText(name || "", colors.grey);
};

function PauseButton({
  id,
  onClick,
  button,
}: {
  id: string;
  onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  button: Sprite[];
}) {
  return (
    <div className="PauseButton" id={id} onClick={onClick}>
      <Row cells={button} />
    </div>
  );
}

function LoadingRow({ preparingMap }: { preparingMap: boolean }) {
  const { ecs } = useWorld();
  const line =
    useContext(LoadingContext) ??
    worldLoading(
      levelConfig[ecs?.metadata.gameEntity[LEVEL]?.name ?? "LEVEL_MENU"].name
    );
  return <Row className="LoadingRow" cells={preparingMap ? mapLoading : line} />;
}

export default function Paused({ preparingMap = false }: { preparingMap?: boolean }) {
  const {
    ecs,
    paused,
    setPaused,
    initial,
    setInitial,
    suspended,
    saveStatus,
    saveGame,
    openMenu,
  } = useWorld();
  const dimensions = useDimensions();
  const inGame = !!ecs && ecs.metadata.gameEntity[LEVEL]?.name !== "LEVEL_MENU";
  const saveable = inGame && !saveStatus?.saving && canSave(ecs);
  const handleSave = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();
      if (saveable) saveGame();
    },
    [saveable, saveGame]
  );
  const handleMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();
      if (inGame) openMenu();
    },
    [inGame, openMenu]
  );
  const handleResume = useCallback(
    (event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.preventDefault();

      setPaused(false);

      if (initial) {
        setInitial(false);
      }
    },
    [initial, setPaused, setInitial]
  );

  const loading = suspended || preparingMap;
  if (!paused && !initial && !loading) return null;

  return (
    <div className="Paused">
      <div className="Cover">
        {Array.from({
          length: dimensions.renderedRows + dimensions.hudRows,
        }).map((_, index) => (
          <Row
            key={index}
            cells={repeat(
              backdrop,
              dimensions.visibleColumns + dimensions.padding * 2
            )}
          />
        ))}
      </div>

      <div className="Overlay">
        {loading ? (
          <>
            <LoadingRow preparingMap={preparingMap} />
            <Row />
            <Row />
          </>
        ) : initial ? (
          <>
            {isTouch ? (
              <>
                <Row cells={createText("▀█▀ █▀▄ █▀▄")} />
                <Row cells={createText(" █  █▄█ █▄█")} />
                <Row cells={createText(" █  █ █ █  ")} />
              </>
            ) : (
              <>
                <Row cells={createText("▄▀▀ █   █ ▄▀▀ █ █")} />
                <Row cells={createText("█   █   █ █   █▄▀")} />
                <Row cells={createText("▀▄▄ ▀▄▄ █ ▀▄▄ █ █")} />
              </>
            )}
            <Row />
            <Row
              cells={createText(
                "to start the game",
                colors.white,
                colors.black
              )}
            />
          </>
        ) : (
          <>
            {/* keep an odd number of rows to stay aligned to cells */}
            {!inGame && <Row />}
            <Row cells={createText("█▀▄ █▀▄ █ █ ▄▀▀ ▄▀▀")} />
            <Row cells={createText("█▄█ █▄█ █ █ █▄▄ █▄▄")} />
            <Row cells={createText("█   █ █ █▄▀ ▄▄▀ █▄▄")} />
            <Row />
            <Row />
            <PauseButton
              id="pause-resume"
              onClick={handleResume}
              button={createButton(
                "RESUME",
                pauseButtonWidth,
                false,
                false,
                false,
                "lime"
              )}
            />
            {inGame && (
              <>
                <Row />
                <PauseButton
                  id="pause-menu"
                  onClick={handleMenu}
                  button={createButton(
                    "MENU",
                    pauseButtonWidth,
                    false,
                    false,
                    false,
                    "red"
                  )}
                />
                <Row />
                <PauseButton
                  id="pause-save"
                  onClick={handleSave}
                  button={createButton("SAVE", pauseButtonWidth, !saveable)}
                />
                <Row
                  cells={addBackground(
                    getSaveText(ecs, saveStatus),
                    colors.black
                  )}
                />
              </>
            )}
          </>
        )}
      </div>
      {!loading && (
        <div className="Resume" id="resume" onClick={handleResume} />
      )}
    </div>
  );
}
