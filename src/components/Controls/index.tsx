import { padOrientation } from "./textures";
import { center, renderText, TerminalState } from "../../engine/utils";

const Controls = ({ state }: { state: TerminalState }) => {
  return (
    <div className="Controls">
      <div className="Row">
        {renderText('══════╤═══════╤══════')}
      </div>

      <div className="Row">
        {state.inventory.spell ? (
          renderText('  /\\  ', 'Freezing')
        ) : (
          renderText('      ')
        )}
        {renderText('│       │ ')}
        {renderText(padOrientation[state.orientation || center][0], 'Pad')}
      </div>

      <div className="Row">
        {state.inventory.spell ? (
          renderText('  \\/  ', 'Freezing')
        ) : (
          renderText('      ')
        )}
        {renderText('│       │ ')}
        {renderText(padOrientation[state.orientation || center][1], 'Pad')}
      </div>
    </div>
  )
};

export default Controls;