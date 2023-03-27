import { Fragment } from "react";
import { getInfinitePosition, getSmoothStyle, getStaticStyle, unitInViewport } from "../../engine/geometry";
import { getUnit, UnitList, UnitMap } from "../../engine/units";
import { getCell, getFog, pointRange, TerminalState, wrapCoordinates } from "../../engine/utils";

const Board = ({ state, unitMap, unitList, remaining, animation }: { state: TerminalState, unitMap: UnitMap, unitList: UnitList, remaining?: number, animation?: boolean }) => {
  const overscan = animation ? 2 : 0;

  return (
    <div className="Viewport">
      <div className="Static">
        {pointRange(state.screenHeight + overscan * 2, offsetY => [state.x, state.y + offsetY - (state.screenHeight - 1 + overscan * 2) / 2]).map(([_, rowY]) => {
          const [__, infiniteRow] = getInfinitePosition(state, 0, rowY);

          return (
            <div className="Row" key={infiniteRow}>
              {pointRange(state.screenWidth + overscan * 2, offsetX => [state.x + offsetX - (state.screenWidth - 1 + overscan * 2) / 2, rowY]).map(([cellX, cellY]) => {
                const cell = getCell(state, cellX, cellY);
                const fog = getFog(state, cellX, cellY);
                const unit = getUnit(state, unitMap, unitList, cellX, cellY);
                const [wrappedX, wrappedY] = wrapCoordinates(state, cellX, cellY);
                const key = `${wrappedX},${wrappedY}`;
                const style = getStaticStyle(state, wrappedX, wrappedY);
                const [infiniteX, infiniteY] = getInfinitePosition(state, cellX, cellY);
                const infiniteKey = `${infiniteX},${infiniteY}`;

                return (
                  <Fragment key={infiniteKey}>
                    <span className={`StaticCell ${fog}`} data-testid={key} style={style}>
                      <span className={`Placeholder`}>{'\u2248'}</span>
                      {cell.grounds}
                      {cell.terrain}
                      {cell.item}
                      {cell.sprite}
                    </span>

                    <span className={`StaticUnit ${fog}`} data-testid={key} style={style}>
                      {unit && (
                        <>
                          {unit.equipments}
                          {unit.particles}
                        </>
                      )}
                    </span>
                  </Fragment>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="Moving">
        {unitList.map(entry => {
          if (!unitInViewport(state, entry.x, entry.y, overscan)) return;

          const isPlayer = entry.x === state.x && entry.y === state.y;
          const fog = getFog(state, entry.x, entry.y);
          const key = entry.id;

          const style = getStaticStyle(state, entry.x, entry.y);

          return (
            <span className={`${isPlayer ? 'PlayerUnit' : 'MovingUnit'} ${fog}`} key={key} data-testid={key} style={style}>
              {entry.entity}
            </span>
          );
        })}
      </div>
    </div>
  )
};

export default Board;