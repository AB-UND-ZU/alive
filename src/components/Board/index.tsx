import { getUnit, Units } from "../../engine/units";
import { getCell, getFog, pointRange, TerminalState, wrapCoordinates } from "../../engine/utils";

const Board = ({ state, units }: { state: TerminalState, units: Units }) => {
  return (
    <>
      {pointRange(state.screenHeight, offsetY => [state.x, state.y + offsetY - (state.screenHeight - 1) / 2]).map(([_, rowY]) => (
        <div className="Row" key={rowY}>
          {pointRange(state.screenWidth, offsetX => [state.x + offsetX - (state.screenWidth - 1) / 2, rowY]).map(([cellX, cellY]) => {
            const cell = getCell(state, cellX, cellY);
            const fog = getFog(state, cellX, cellY);
            const unit = getUnit(state, units, cellX, cellY);
            const [wrappedX, wrappedY] = wrapCoordinates(state, cellX, cellY);
            const key = `${wrappedX},${wrappedY}`;

            return (
              <span className={`Cell ${fog === 'fog' ? 'Fog' : ''}`} key={key} data-testid={key}>
                {fog === 'dark' ? (
                  <span className="Entity Dark">{'\u2248'}</span>
                ) : (
                  <>
                    {cell.grounds}
                    {cell.terrain}
                    {cell.item}
                    {cell.sprite}
                    {fog === 'visible' && unit && (
                      <>
                        {unit.creature}
                        {unit.equipments}
                        {unit.particles}
                      </>
                    )}
                  </>
                )}
              </span>
            );
          })}
        </div>
      ))}
    </>
  )
};

export default Board;