import { padOrientation } from "./textures";
import { center, renderText, TerminalState } from "../../engine/utils";
import { getQuest } from "../../engine/quests";

const clampOffset = (state: TerminalState, length: number, truncate: number, index: number, duration: number) => {
  const offset = (state.tick + index) % (length + truncate + duration);

  if (index <= offset && offset < index + duration) return index;

  return offset < index ? offset : offset - duration;
}

const truncate = 7;
const marquee = (state: TerminalState, layers: string[], backgrounds: string[][] = []) => {
  const length = layers.length && layers[0].length;

  if (!length) return renderText(' '.repeat(truncate));

  const offset = clampOffset(state, length, truncate, truncate - 1, truncate * 2);
  const padding = ' '.repeat(truncate);

  return Array.from({ length: truncate }).map((_, visibleIndex) => {
    const index = offset + visibleIndex - truncate;
    return (
      <span className="Cell" key={index}>
        {layers.map((text, layerIndex) => {
          const char = `${padding}${text}${padding}`[index + truncate];
          return (
            <span key={layerIndex} className={`Entity ${backgrounds[layerIndex][index] || 'HUD'}`}>{char}</span>
          );
        })}
      </span>
    );
  });
};

const Controls = ({ state }: { state: TerminalState }) => {
  const spell = state.inventory.spell ? state.equipments[state.inventory.spell].entity.props.material : undefined;
  const quest = getQuest(state);

  return (
    <div className="Controls">
      <div className="Row">
        {renderText('══════╤═══════╤══════')}
      </div>

      <div className="Row">
        {quest?.action ? (
          <>
            {renderText(' ')}
            {renderText(` ${quest.action} `, 'Black', 'Pad')}
            {renderText('┐', 'HUD')}
          </>
        ) : (state.inventory.spell ? (
          renderText('  /\\  ', state.mp > 0 ? `Spell ${spell}` : 'HUD')
        ) : (
          renderText('      ')
        ))}
        {renderText('│ ')}
        {renderText(quest?.title || 'Quest', 'Pad')}
        {renderText(' │ ')}
        {renderText(padOrientation[state.orientation || center][0], 'Pad')}
      </div>

      <div className="Row">
        {quest?.action ? (
          renderText(' └───┘', 'HUD')
        ) : (state.inventory.spell ? (
          renderText('  \\/  ', state.mp > 0 ? `Spell ${spell}` : 'HUD')
        ) : (
          renderText('      ')
        ))}
        {renderText('│')}
        {quest ? marquee(state, ...quest.render(state)) : renderText('       ')}
        {renderText('│ ')}
        {renderText(padOrientation[state.orientation || center][1], 'Pad')}
      </div>
    </div>
  )
};

export default Controls;