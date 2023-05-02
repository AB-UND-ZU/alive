import { Fragment } from "react";
import { getInfinitePosition, getStaticStyle, unitInViewport } from "../../engine/geometry";
import { Units } from "../../engine/units";
import { getCell, getFog, pointRange, TerminalState, wrapCoordinates } from "../../engine/utils";

const Board = ({ state, units, animation }: { state: TerminalState, units: Units, animation?: boolean }) => {
  const overscan = animation ? 2 : 0;

  const [boardX, boardY] = getInfinitePosition(state, state.cameraX, state.cameraY);

  const boardStyle: React.CSSProperties = {
    top: `${boardY * 32}px`,
    left: `${boardX * 18}px`,
    marginLeft: `${boardX * -18}px`,
    marginTop: `${boardY * -32}px`,
  };

  return (
    <div className="Viewport">
      <div className="Board" style={boardStyle}>
        <div className="Static">
          {pointRange(state.screenHeight + overscan * 2, offsetY => [state.cameraX, state.cameraY + offsetY - (state.screenHeight - 1 + overscan * 2) / 2]).map(([_, rowY]) => {
            const infiniteRow = getInfinitePosition(state, 0, rowY)[1];

            return (
              <div className="Row" key={infiniteRow}>
                {pointRange(state.screenWidth + overscan * 2, offsetX => [state.cameraX + offsetX - (state.screenWidth - 1 + overscan * 2) / 2, rowY]).map(([cellX, cellY]) => {
                  const cell = getCell(state, cellX, cellY);
                  const fog = getFog(state, cellX, cellY);
                  const [wrappedX, wrappedY] = wrapCoordinates(state, cellX, cellY);
                  const key = `${wrappedX},${wrappedY}`;
                  const [infiniteX, infiniteY] = getInfinitePosition(state, cellX, cellY);
                  const infiniteKey = `${infiniteX},${infiniteY}`;

                  return (
                    <Fragment key={infiniteKey}>
                      <span className={`StaticCell ${fog}`} data-testid={key}>
                        <span className={`Placeholder`}>{'\u2248'}</span>
                        {cell.grounds}
                        {cell.terrain}
                        {cell.item}
                        {cell.sprite}
                      </span>
                    </Fragment>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="Moving">
          {units.map(unit => {
            if (!unitInViewport(state, unit.x, unit.y, overscan)) return null;

            const isPlayer = unit.x === state.cameraX && unit.y === state.cameraY;
            const fog = getFog(state, unit.x, unit.y);
            const key = unit.id;

            const style = getStaticStyle(state, unit.x, unit.y);

            return (
              <span className={`${isPlayer ? 'PlayerUnit' : 'MovingUnit'} ${fog}`} key={key} data-testid={`${unit.x},${unit.y}`} style={style}>
                {unit.entity}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  )
};

export default Board;