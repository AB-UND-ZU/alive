import { padOrientation } from "./textures";
import { center, renderText, TerminalState } from "../../engine/utils";

const truncate = 7;
const marquee = (state: TerminalState, text: string) => {
  const offset = state.tick % (text.length + truncate);
  const padding = ' '.repeat(truncate);
  const visible = `${padding}${text}${padding}`.substring(offset, offset + truncate);
  return visible.split('').map((char, index) => (
    <span className="Cell" key={index}>
      <span className="Entity HUD">{char}</span>
    </span>
  ));
};

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
        {renderText('Quest', 'Pad')}
        {renderText(' │ ')}
        {renderText(padOrientation[state.orientation || center][0], 'Pad')}
      </div>

      <div className="Row">
        {state.inventory.spell ? (
          renderText('  \\/  ', state.mp > 0 ? `Spell ${spell}` : 'HUD')
        ) : (
          renderText('      ')
        )}
        {renderText('│')}
        {marquee(state, 'Find a stick')}
        {renderText('│ ')}
        {renderText(padOrientation[state.orientation || center][1], 'Pad')}
      </div>
    </div>
  )
};

export default Controls;