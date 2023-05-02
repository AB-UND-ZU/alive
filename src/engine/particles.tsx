import { Attacked, Shock, Swimming } from "./entities";
import { addPoints, center, directionOffset, getAbsolutePosition, isOrphaned, isWater, removeProcessor, resolveCompositeId, TerminalState, updateProcessorProps } from "./utils";

export const tickParticle = (prevState: TerminalState, id: number) => {
  let state = { ...prevState };

  if (isOrphaned(state, { container: 'particles', id })) {
    state = removeProcessor(state, { container: 'particles', id });
    return state;
  }

  const particleProcessor = state.particles[id];
  const [x, y] = getAbsolutePosition(state, particleProcessor);

  // remove fading particles
  if (
    particleProcessor.entity.type === Attacked ||
    (particleProcessor.entity.type === Swimming && !isWater(state, x, y))
  ) {
    // remove from parent
    if (particleProcessor.parent) {
      const parent = resolveCompositeId(state, particleProcessor.parent);

      if (parent && 'particles' in parent.entity.props) {
        const parentParticles = [...parent.entity.props.particles];
        parentParticles.splice(parentParticles.indexOf(id), 1);
        state = updateProcessorProps(state, particleProcessor.parent, { particles: parentParticles });
      }
    }

    state = removeProcessor(state, { container: 'particles', id });
    return state;
  }

  return state;
}