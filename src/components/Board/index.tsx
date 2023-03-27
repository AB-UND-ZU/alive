import { getSmoothStyle } from "../../engine/geometry";
import { getUnit, UnitList, UnitMap } from "../../engine/units";
import { getCell, getFog, pointRange, TerminalState, wrapCoordinates } from "../../engine/utils";

const Board = ({ state, unitMap, unitList, remaining, animation }: { state: TerminalState, unitMap: UnitMap, unitList: UnitList, remaining?: number, animation?: boolean }) => {
  const overscan = animation ? 2 : 0;

  return (
    <div className="Viewport">
      <div className="Board" style={getSmoothStyle(state, state.x, state.y, overscan)}>
        {pointRange(state.screenHeight + overscan * 2, offsetY => [state.x, state.y + offsetY - (state.screenHeight - 1 + overscan * 2) / 2]).map(([_, rowY]) => (
          <div className="Row" key={rowY}>
            {pointRange(state.screenWidth + overscan * 2, offsetX => [state.x + offsetX - (state.screenWidth - 1 + overscan * 2) / 2, rowY]).map(([cellX, cellY]) => {
              const cell = getCell(state, cellX, cellY);
              const fog = getFog(state, cellX, cellY);
              const unit = getUnit(state, unitMap, unitList, cellX, cellY);
              const [wrappedX, wrappedY] = wrapCoordinates(state, cellX, cellY);
              const key = `${wrappedX},${wrappedY}`;

              return (
                <span className={`Cell ${fog}`} key={key} data-testid={key}>
                  <span className={`Entity Placeholder ${fog}`}>{'\u2248'}</span>
                  <>
                    {cell.grounds}
                    {cell.terrain}
                    {cell.item}
                    {cell.sprite}
                    {unit && (
                      <>
                        {unit.particles}
                      </>
                    )}
                  </>
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <div className="Units">
        {unitList.map(entry => {
          const isPlayer = entry.x === state.x && entry.y === state.y;
          const offsetX = (entry.x - state.x + state.width * 3 / 2) % state.width - state.width / 2;
          const offsetY = (entry.y - state.y + state.height * 3 / 2) % state.height - state.height / 2;
          if (Math.abs(offsetX) > (state.screenWidth - 1 + overscan * 2) / 2) return;
          if (Math.abs(offsetY) > (state.screenHeight - 1 + overscan * 2) / 2) return;

          const fog = getFog(state, entry.x, entry.y);
          const key = entry.id;

          const stats = 3;
          const style = {
            top: `${192 + offsetY * 32 + stats * 32}px`,
            left: `${180 + offsetX * 18}px`,
          };

          return (
            <span className={`${fog} UnitCell ${isPlayer ? 'PlayerCell' : ''}`} key={key} data-testid={key} style={style}>
              <div className="Units" style={isPlayer ? getSmoothStyle(state, entry.x, entry.y) : {}}>
                {entry.entity}
              </div>
            </span>
          );
        })}
      </div>
    </div>
  )
};

export default Board;