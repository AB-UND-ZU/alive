import { padOrientation } from "./textures";
import { center, renderText, TerminalState } from "../../engine/utils";

const Controls = ({ state }: { state: TerminalState }) => {
  return (
    <>
      <div className="Row">
        {renderText('══════╤═══════╤══════')}
      </div>

      <div className="Row">
        {renderText('  /\\  ', state.inventory.spell ? 'Freezing' : 'HUD')}
        {renderText('│       │ ')}
        {renderText(padOrientation[state.orientation || center][0], 'Pad')}
      </div>

      <div className="Row">
        {renderText('  \\/  ', state.inventory.spell ? 'Freezing' : 'HUD')}
        {renderText('│       │ ')}
        {renderText(padOrientation[state.orientation || center][1], 'Pad')}
      </div>
    </>
  )
};

export default Controls;