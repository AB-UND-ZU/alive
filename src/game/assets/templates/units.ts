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
const doorClosedElementTemplate: Sprite = {
  name: "Locked",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: TEMPLATE_COLORS.elementPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.elementPrimary },
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
export const doorClosed = createTemplate({
  sprite: doorClosedTemplate,
  materialElementSprite: doorClosedElementTemplate,
});
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
const entryClosedElementTemplate: Sprite = {
  name: "Entry",
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0106", color: TEMPLATE_COLORS.elementPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.elementPrimary },
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
const entryClosedIron: Sprite = {
  name: "Entry",
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0106", color: colors.silver },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.silver },
  ],
};
export const entryClosed = createTemplate({
  sprite: entryClosedTemplate,
  materialElementSprite: entryClosedElementTemplate,
});
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
const entryClosedDisplayElementTemplate: Sprite = {
  name: "Entry",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0106", color: TEMPLATE_COLORS.elementPrimary },
    { char: "∙", color: colors.black },
    { char: ".", color: TEMPLATE_COLORS.elementPrimary },
  ],
};
const entryClosedDisplayWood: Sprite = {
  name: "Entry",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: ".", color: colors.black },
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
export const entryClosedDisplay = createTemplate({
  sprite: entryClosedDisplayTemplate,
  materialElementSprite: entryClosedDisplayElementTemplate,
});
entryClosedDisplay.wood.default = entryClosedDisplayWood;
entryClosedDisplay.iron.default = entryClosedDisplayIron;

const lockTemplate: Sprite = {
  name: "Lock",
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const lockElementTemplate: Sprite = {
  name: "Lock",
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.elementPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.elementPrimary },
  ],
};
export const lock = createTemplate({
  sprite: lockTemplate,
  materialElementSprite: lockElementTemplate,
});
