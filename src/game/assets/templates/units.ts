import { createTemplate, TEMPLATE_COLORS } from ".";
import { Sprite } from "../../../engine/components/sprite";
import { colors } from "../colors";

// doors

const doorOpenTemplate: Sprite = {
  name: "Door",
  terminal: { layers: [] },
  layers: [{ char: "▌", color: colors.maroon }],
};
export const doorOpen = createTemplate({ sprite: doorOpenTemplate });

const doorClosedTemplate: Sprite = {
  name: "Locked",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "╒", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const doorClosedElementTemplate: Sprite = {
  name: "Locked",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "╒", color: TEMPLATE_COLORS.elementSecondary },
    ],
  },
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "\u0106", color: TEMPLATE_COLORS.elementSecondary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.elementSecondary },
  ],
};
const doorClosedWood: Sprite = {
  name: "Door",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "╒", color: colors.black },
    ],
  },
  layers: [
    { char: "\u0107", color: colors.maroon },
    { char: "∙", color: colors.maroon },
    { char: ".", color: colors.black },
  ],
};
const doorClosedFire: Sprite = {
  name: "Door",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "╒", color: colors.red },
    ],
  },
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

export const portOpenTemplate: Sprite = {
  name: "Port",
  terminal: { layers: [] },
  layers: [{ char: "▌", color: colors.silver }],
};
export const portOpen = createTemplate({ sprite: portOpenTemplate });

const portClosedTemplate: Sprite = {
  name: "Port",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
  layers: [
    { char: "█", color: colors.silver },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const portClosedElementTemplate: Sprite = {
  name: "Port",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: TEMPLATE_COLORS.elementSecondary },
    ],
  },
  layers: [
    { char: "█", color: colors.silver },
    { char: "\u0106", color: TEMPLATE_COLORS.elementSecondary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.elementSecondary },
  ],
};
const portClosedWood: Sprite = {
  name: "Port",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: colors.black },
    ],
  },
  layers: [
    { char: "█", color: colors.silver },
    { char: "\u0106", color: colors.black },
    { char: ".", color: colors.black },
  ],
};
const portClosedFire: Sprite = {
  name: "Port",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: colors.red },
    ],
  },
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
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const entryClosedElementTemplate: Sprite = {
  name: "Entry",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: TEMPLATE_COLORS.elementSecondary },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0106", color: TEMPLATE_COLORS.elementSecondary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.elementSecondary },
  ],
};
const entryClosedWood: Sprite = {
  name: "Entry",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: colors.black },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0106", color: colors.black },
    { char: ".", color: colors.black },
  ],
};
const entryClosedIron: Sprite = {
  name: "Entry",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: colors.grey },
    ],
  },
  layers: [
    { char: "█", color: colors.grey },
    { char: "\u0106", color: colors.silver },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.silver },
  ],
};
const entryClosedFire: Sprite = {
  name: "Entry",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: colors.red },
    ],
  },
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
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: colors.black },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const entryClosedDisplayElementTemplate: Sprite = {
  name: "Entry",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: TEMPLATE_COLORS.elementSecondary },
    ],
  },
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0106", color: TEMPLATE_COLORS.elementSecondary },
    { char: "∙", color: colors.black },
    { char: ".", color: TEMPLATE_COLORS.elementSecondary },
  ],
};
const entryClosedDisplayWood: Sprite = {
  name: "Entry",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: colors.black },
    ],
  },
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: ".", color: colors.black },
  ],
};
const entryClosedDisplayIron: Sprite = {
  name: "Entry",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: colors.grey },
    ],
  },
  layers: [
    { char: "\u0107", color: colors.grey },
    { char: "\u0106", color: colors.silver },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.silver },
  ],
};
const entryClosedDisplayFire: Sprite = {
  name: "Entry",
  terminal: {
    layers: [
      { char: "█", color: colors.silver },
      { char: "╒", color: colors.red },
    ],
  },
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

const fenceDoorClosedTemplate: Sprite = {
  name: "Gate",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "╒", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
  layers: [
    { char: "M", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
    { char: "■", color: colors.grey },
    { char: "±", color: colors.grey },

    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const woodFenceDoorClosed: Sprite = {
  name: "Gate",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "╒", color: colors.black },
    ],
  },
  layers: [
    { char: "M", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
    { char: "=", color: colors.grey },
  ],
};
export const fenceDoorClosed = createTemplate({
  sprite: fenceDoorClosedTemplate,
});
fenceDoorClosed.wood.default = woodFenceDoorClosed;

const fenceDoorOpenTemplate: Sprite = {
  name: "Gate",
  terminal: { layers: [] },
  layers: [
    { char: "M", color: colors.maroon },
    { char: "■", color: colors.grey },
    { char: "±", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
  ],
};
const woodFenceDoorOpen: Sprite = {
  name: "Gate",
  terminal: { layers: [] },
  layers: [
    { char: "M", color: colors.maroon },
    { char: "=", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
  ],
};
export const fenceDoorOpen = createTemplate({
  sprite: fenceDoorOpenTemplate,
});
fenceDoorOpen.wood.default = woodFenceDoorOpen;

const palisadeDoorClosedTemplate: Sprite = {
  name: "Gate",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "╒", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
    { char: "■", color: colors.maroon },
    { char: "±", color: colors.maroon },

    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const woodPalisadeDoorClosed: Sprite = {
  name: "Gate",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "╒", color: colors.black },
    ],
  },
  layers: [
    { char: "M", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
    { char: "■", color: colors.maroon },
    { char: "±", color: colors.maroon },
  ],
};
export const palisadeDoorClosed = createTemplate({
  sprite: palisadeDoorClosedTemplate,
});
palisadeDoorClosed.wood.default = woodPalisadeDoorClosed;

const palisadeDoorOpenTemplate: Sprite = {
  name: "Gate",
  terminal: { layers: [] },
  layers: [
    { char: "M", color: colors.grey },
    { char: "■", color: colors.maroon },
    { char: "±", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
  ],
};
const woodPalisadeDoorOpen: Sprite = {
  name: "Gate",
  terminal: { layers: [] },
  layers: [
    { char: "M", color: colors.grey },
    { char: "■", color: colors.maroon },
    { char: "±", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
  ],
};
export const palisadeDoorOpen = createTemplate({
  sprite: palisadeDoorOpenTemplate,
});
palisadeDoorOpen.wood.default = woodPalisadeDoorOpen;

const barrierDoorClosedTemplate: Sprite = {
  name: "Gate",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "╒", color: TEMPLATE_COLORS.materialPrimary },
    ],
  },
  layers: [
    { char: "M", color: colors.red },
    { char: "m", color: colors.grey },
    { char: "w", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
    { char: "■", color: colors.maroon },
    { char: "±", color: colors.maroon },

    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const woodBarrierDoorClosed: Sprite = {
  name: "Gate",
  terminal: {
    layers: [
      { char: "█", color: colors.maroon },
      { char: "╒", color: colors.black },
    ],
  },
  layers: [
    { char: "M", color: colors.red },
    { char: "m", color: colors.grey },
    { char: "w", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
    { char: "=", color: colors.maroon },
  ],
};
export const barrierDoorClosed = createTemplate({
  sprite: barrierDoorClosedTemplate,
});
barrierDoorClosed.wood.default = woodBarrierDoorClosed;

const barrierDoorOpenTemplate: Sprite = {
  name: "Gate",
  terminal: { layers: [] },
  layers: [
    { char: "M", color: colors.red },
    { char: "m", color: colors.grey },
    { char: "w", color: colors.grey },
    { char: "■", color: colors.maroon },
    { char: "±", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
  ],
};
const woodBarrierDoorOpen: Sprite = {
  name: "Gate",
  terminal: { layers: [] },
  layers: [
    { char: "M", color: colors.red },
    { char: "m", color: colors.grey },
    { char: "w", color: colors.grey },
    { char: "=", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
  ],
};
export const barrierDoorOpen = createTemplate({
  sprite: barrierDoorOpenTemplate,
});
barrierDoorOpen.wood.default = woodBarrierDoorOpen;

const lockTemplate: Sprite = {
  name: "Lock",
  terminal: { layers: [{ char: "╒", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const lockElementTemplate: Sprite = {
  name: "Lock",
  terminal: {
    layers: [{ char: "╒", color: TEMPLATE_COLORS.elementSecondary }],
  },
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.elementSecondary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.elementSecondary },
  ],
};
const fireLock: Sprite = {
  name: "Lock",
  terminal: { layers: [{ char: "╒", color: colors.red }] },
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
