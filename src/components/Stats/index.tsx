import React from "react";
import { Bush, Flower, Herb, Seed } from "../../engine/entities";
import { renderText, TerminalState } from "../../engine/utils";

const renderInventory = (state: TerminalState, id?: number) => {
  if (!id) return null;
  
  return React.cloneElement(state.equipments[id].entity, { interaction: undefined });
};

const Stats = ({ state }: { state: TerminalState }) => {
  return (
    <div className="Stats">
      <div className="Row">
        {renderText(`${state.hp.toString().padStart(2)}\u0102 `, 'Life')}
        {renderText(`${state.gold.toString().padStart(2)}\u0108 `, 'Gold')}
        {renderText(`${state.wood.toString().padStart(2)}\u2261 `, 'Wood')}
        {renderText(`${state.seed.toString().padStart(2)}`, 'Seed')}
        <span className="Cell">
          <Seed amount={3} />
          <Bush />
        </span>
        {renderText('│')}
        <span className="Cell">
          {renderInventory(state, state.inventory.sword)}
        </span>
        <span className="Cell">
          {renderInventory(state, state.inventory.armor)}
        </span>
        <span className="Cell">
          {renderInventory(state, state.inventory.spell)}
        </span>
      </div>

      <div className="Row">
        {renderText(`${state.mp.toString().padStart(2)}\u0103 `, 'Mana')}
        {renderText(`${state.xp.toString().padStart(2)}+ `, 'Experience')}
        {renderText(`${state.iron.toString().padStart(2)}\u00f7 `, 'Iron')}
        {renderText(`${state.herb.toString().padStart(2)}`, 'Herb')}
        <span className="Cell">
          <Herb amount={3} />
          <Flower />
        </span>
        {renderText('│')}
        <span className="Cell" />
        <span className="Cell" />
        <span className="Cell" />
        <span className="Cell" />
        <span className="Cell">
          {renderInventory(state, state.inventory.compass)}
        </span>
      </div>

      <div className="Row">
        {renderText('═══════════════╧═════')}
      </div>
    </div>
  )
};

export default Stats;