import { padOrientation } from "./textures";
import { center, renderText, TerminalState } from "../../engine/utils";

const Controls = ({ state }: { state: TerminalState }) => {
  const spell = state.inventory.spell ? state.equipments[state.inventory.spell].entity.props.material : undefined;

  return (
    <div className="Controls">
      <div className="Row">
        {renderText('══════╤═══════╤══════')}
      </div>

      <div className="Row">
        {state.inventory.spell ? (
          renderText('  /\\  ', state.mp > 0 ? `Spell ${spell}` : 'HUD')
        ) : (
          renderText('      ')
        )}
        {renderText('│ ')}
        {renderText('Alive', 'Pad')}
        {renderText(' │ ')}
        {renderText(padOrientation[state.orientation || center][0], 'Pad')}
      </div>

      <div className="Row">
        {state.inventory.spell ? (
          renderText('  \\/  ', state.mp > 0 ? `Spell ${spell}` : 'HUD')
        ) : (
          renderText('      ')
        )}
        {renderText(`│ ${Math.floor(state.tick / 3).toString().padStart(5)} │ `)}
        {renderText(padOrientation[state.orientation || center][1], 'Pad')}
      </div>
    </div>
  )
};

export default Controls;