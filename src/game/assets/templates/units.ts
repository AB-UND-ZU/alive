import { createTemplate, TEMPLATE_COLORS } from ".";
import { Sprite } from "../../../engine/components/sprite";
import { colors } from "../colors";

// doors

const doorClosedTemplate: Sprite = {
  name: "Locked",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const doorClosedWood: Sprite = {
  name: "Door",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "∙", color: colors.maroon },
    { char: ".", color: colors.black },
  ],
};
export const doorClosed = createTemplate({ sprite: doorClosedTemplate });
doorClosed.wood.default = doorClosedWood;

const entryClosedTemplate: Sprite = {
  name: "Entry",
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const entryClosedWood: Sprite = {
  name: "Entry",
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0106", color: colors.black },
    { char: ".", color: colors.black },
  ],
};
const entryClosedDisplayWood: Sprite = {
  name: "Entry",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: ".", color: colors.black },
  ],
};
const entryClosedIron: Sprite = {
  name: "Entry",
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0106", color: colors.silver },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.silver },
  ],
};
const entryClosedDisplayIron: Sprite = {
  name: "Entry",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0106", color: colors.silver },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.silver },
  ],
};
export const entryClosed = createTemplate({ sprite: entryClosedTemplate });
entryClosed.wood.default = entryClosedWood;
entryClosed.iron.default = entryClosedIron;

const entryClosedDisplayTemplate: Sprite = {
  name: "Entry",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: colors.black },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
export const entryClosedDisplay = createTemplate({
  sprite: entryClosedDisplayTemplate,
});
entryClosedDisplay.wood.default = entryClosedDisplayWood;
entryClosedDisplay.iron.default = entryClosedDisplayIron;
