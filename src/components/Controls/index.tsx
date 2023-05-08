import { padOrientation } from "./textures";
import { center, renderText, TerminalState } from "../../engine/utils";

const clampOffset = (state: TerminalState, length: number, truncate: number, index: number, duration: number) => {
  const offset = state.tick % (length + truncate + duration);

  if (index <= offset && offset < index + duration) return index;

  return offset < index ? offset : offset - duration;
}

const truncate = 7;
const marquee = (state: TerminalState, text: string, backgrounds: string[] = []) => {
  const offset = clampOffset(state, text.length, truncate, truncate - 1, truncate * 2);
  const padding = ' '.repeat(truncate);
  const visible = `${padding}${text}${padding}`.substring(offset, offset + truncate);
  return visible.split('').map((char, index) => (
    <span className="Cell" key={index}>
      <span className={`Entity ${backgrounds[offset + index - truncate] || 'HUD'}`}>{char}</span>
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
        {marquee(state, '1\u2261 Find a stick', ['Wood', 'Wood'])}
        {renderText('│ ')}
        {renderText(padOrientation[state.orientation || center][1], 'Pad')}
      </div>
    </div>
  )
};

export default Controls;