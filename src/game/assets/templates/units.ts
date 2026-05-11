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
    { char: "\u0106", color: TEMPLATE_COLORS.elementSecondary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.elementSecondary },
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
const doorClosedFire: Sprite = {
  name: "Door",
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: colors.red },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.red },
  ],
};
export const doorClosed = createTemplate({
  sprite: doorClosedTemplate,
  elementSprite: doorClosedElementTemplate,
});
doorClosed.wood.default = doorClosedWood;
doorClosed.default.fire = doorClosedFire;

const portClosedTemplate: Sprite = {
  name: "Port",
  layers: [
    { char: "█", color: colors.silver },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const portClosedElementTemplate: Sprite = {
  name: "Port",
  layers: [
    { char: "█", color: colors.silver },
    { char: "\u0106", color: TEMPLATE_COLORS.elementSecondary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.elementSecondary },
  ],
};
const portClosedWood: Sprite = {
  name: "Port",
  layers: [
    { char: "█", color: colors.silver },
    { char: "\u0106", color: colors.black },
    { char: ".", color: colors.black },
  ],
};
const portClosedFire: Sprite = {
  name: "Port",
  layers: [
    { char: "█", color: colors.silver },
    { char: "\u0106", color: colors.red },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.red },
  ],
};
export const portClosed = createTemplate({
  sprite: portClosedTemplate,
  elementSprite: portClosedElementTemplate,
});
portClosed.wood.default = portClosedWood;
portClosed.default.fire = portClosedFire;

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
    { char: "\u0106", color: TEMPLATE_COLORS.elementSecondary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.elementSecondary },
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
const entryClosedFire: Sprite = {
  name: "Entry",
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0106", color: colors.red },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.red },
  ],
};
export const entryClosed = createTemplate({
  sprite: entryClosedTemplate,
  elementSprite: entryClosedElementTemplate,
});
entryClosed.wood.default = entryClosedWood;
entryClosed.iron.default = entryClosedIron;
entryClosed.default.fire = entryClosedFire;

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
    { char: "\u0106", color: TEMPLATE_COLORS.elementSecondary },
    { char: "∙", color: colors.black },
    { char: ".", color: TEMPLATE_COLORS.elementSecondary },
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
const entryClosedDisplayFire: Sprite = {
  name: "Entry",
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0106", color: colors.red },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.red },
  ],
};
export const entryClosedDisplay = createTemplate({
  sprite: entryClosedDisplayTemplate,
  elementSprite: entryClosedDisplayElementTemplate,
});
entryClosedDisplay.wood.default = entryClosedDisplayWood;
entryClosedDisplay.iron.default = entryClosedDisplayIron;
entryClosedDisplay.default.fire = entryClosedDisplayFire;

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
    { char: "\u0106", color: TEMPLATE_COLORS.elementSecondary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.elementSecondary },
  ],
};
const fireLock: Sprite = {
  name: "Lock",
  layers: [
    { char: "\u0106", color: colors.red },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.red },
  ],
};
export const lock = createTemplate({
  sprite: lockTemplate,
  elementSprite: lockElementTemplate,
});
lock.default.fire = fireLock;
