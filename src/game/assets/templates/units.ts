import { namedSprite } from "../spriteIds";
import { createTemplate, TEMPLATE_COLORS } from ".";
import { Sprite, SpriteArtwork } from "../../../engine/components/sprite";
import { colors } from "../colors";
import { recolorSprite } from "../ui";

// doors

const doorOpenTemplate: SpriteArtwork = {
  name: "Door",
  terminal: { layers: [] },
  layers: [{ char: "▌", color: colors.maroon }],
};
export const doorOpen = createTemplate("door_open", { sprite: doorOpenTemplate });

const doorClosedTemplate: SpriteArtwork = {
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
const doorClosedElementTemplate: SpriteArtwork = {
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
const doorClosedWood: Sprite = namedSprite("door_closed_wood", {
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
});
const doorClosedFire: Sprite = namedSprite("door_closed_fire_locked", {
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
});
export const doorClosed = createTemplate("door_closed", {
  sprite: doorClosedTemplate,
  elementSprite: doorClosedElementTemplate,
});
doorClosed.wood.default = doorClosedWood;
doorClosed.default.fire = doorClosedFire;

export const portOpenTemplate: SpriteArtwork = {
  name: "Port",
  terminal: { layers: [] },
  layers: [{ char: "▌", color: colors.silver }],
};
export const portOpen = createTemplate("port_open", { sprite: portOpenTemplate });

const portClosedTemplate: SpriteArtwork = {
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
const portClosedElementTemplate: SpriteArtwork = {
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
const portClosedWood: Sprite = namedSprite("port_closed_wood", {
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
});
const portClosedFire: Sprite = namedSprite("port_closed_fire_locked", {
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
});
export const portClosed = createTemplate("port_closed", {
  sprite: portClosedTemplate,
  elementSprite: portClosedElementTemplate,
});
portClosed.wood.default = portClosedWood;
portClosed.default.fire = portClosedFire;

const frame = (id: string, port: Sprite): Sprite => namedSprite(id, {
  ...recolorSprite(port, { [colors.silver]: colors.teal }),
  name: "Frame",
});
export const frameOpen = { wood: { default: frame("frame_open", portOpen.wood.default) } };
export const frameClosed = { wood: { default: frame("frame_closed", portClosed.wood.default) } };

const entryClosedTemplate: SpriteArtwork = {
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
const entryClosedElementTemplate: SpriteArtwork = {
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
const entryClosedWood: Sprite = namedSprite("entry_closed_wood", {
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
});
const entryClosedIron: Sprite = namedSprite("entry_closed_iron", {
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
});
const entryClosedFire: Sprite = namedSprite("entry_closed_fire_locked", {
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
});
export const entryClosed = createTemplate("entry_closed", {
  sprite: entryClosedTemplate,
  elementSprite: entryClosedElementTemplate,
});
entryClosed.wood.default = entryClosedWood;
entryClosed.iron.default = entryClosedIron;
entryClosed.default.fire = entryClosedFire;

const entryClosedDisplayTemplate: SpriteArtwork = {
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
const entryClosedDisplayElementTemplate: SpriteArtwork = {
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
const entryClosedDisplayWood: Sprite = namedSprite("entry_closed_display_wood", {
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
});
const entryClosedDisplayIron: Sprite = namedSprite("entry_closed_display_iron", {
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
});
const entryClosedDisplayFire: Sprite = namedSprite("entry_closed_display_fire_locked", {
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
});
export const entryClosedDisplay = createTemplate("entry_closed_display", {
  sprite: entryClosedDisplayTemplate,
  elementSprite: entryClosedDisplayElementTemplate,
});
entryClosedDisplay.wood.default = entryClosedDisplayWood;
entryClosedDisplay.iron.default = entryClosedDisplayIron;
entryClosedDisplay.default.fire = entryClosedDisplayFire;

const fenceDoorClosedTemplate: SpriteArtwork = {
  name: "Gate",
  terminal: { layers: [{ char: "m", color: TEMPLATE_COLORS.materialPrimary }] },
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
const woodFenceDoorClosed: Sprite = namedSprite("wood_fence_door_closed", {
  name: "Gate",
  terminal: { layers: [{ char: "m", color: colors.maroon }] },
  layers: [
    { char: "M", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
    { char: "=", color: colors.grey },
  ],
});
export const fenceDoorClosed = createTemplate("fence_door_closed", {
  sprite: fenceDoorClosedTemplate,
});
fenceDoorClosed.wood.default = woodFenceDoorClosed;

const fenceDoorOpenTemplate: SpriteArtwork = {
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
const woodFenceDoorOpen: Sprite = namedSprite("wood_fence_door_open", {
  name: "Gate",
  terminal: { layers: [] },
  layers: [
    { char: "M", color: colors.maroon },
    { char: "=", color: colors.grey },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
  ],
});
export const fenceDoorOpen = createTemplate("fence_door_open", {
  sprite: fenceDoorOpenTemplate,
});
fenceDoorOpen.wood.default = woodFenceDoorOpen;

const palisadeDoorClosedTemplate: SpriteArtwork = {
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
const woodPalisadeDoorClosed: Sprite = namedSprite("wood_palisade_door_closed", {
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
});
export const palisadeDoorClosed = createTemplate("palisade_door_closed", {
  sprite: palisadeDoorClosedTemplate,
});
palisadeDoorClosed.wood.default = woodPalisadeDoorClosed;

const palisadeDoorOpenTemplate: SpriteArtwork = {
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
const woodPalisadeDoorOpen: Sprite = namedSprite("wood_palisade_door_open", {
  name: "Gate",
  terminal: { layers: [] },
  layers: [
    { char: "M", color: colors.grey },
    { char: "■", color: colors.maroon },
    { char: "±", color: colors.maroon },
    { char: "[", color: colors.black },
    { char: "]", color: colors.black },
  ],
});
export const palisadeDoorOpen = createTemplate("palisade_door_open", {
  sprite: palisadeDoorOpenTemplate,
});
palisadeDoorOpen.wood.default = woodPalisadeDoorOpen;

const barrierDoorClosedTemplate: SpriteArtwork = {
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
const woodBarrierDoorClosed: Sprite = namedSprite("wood_barrier_door_closed", {
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
});
export const barrierDoorClosed = createTemplate("barrier_door_closed", {
  sprite: barrierDoorClosedTemplate,
});
barrierDoorClosed.wood.default = woodBarrierDoorClosed;

const barrierDoorOpenTemplate: SpriteArtwork = {
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
const woodBarrierDoorOpen: Sprite = namedSprite("wood_barrier_door_open", {
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
});
export const barrierDoorOpen = createTemplate("barrier_door_open", {
  sprite: barrierDoorOpenTemplate,
});
barrierDoorOpen.wood.default = woodBarrierDoorOpen;

const lockTemplate: SpriteArtwork = {
  name: "Lock",
  terminal: { layers: [{ char: "╒", color: TEMPLATE_COLORS.materialPrimary }] },
  layers: [
    { char: "\u0106", color: TEMPLATE_COLORS.materialPrimary },
    { char: "∙", color: TEMPLATE_COLORS.transparent },
    { char: ".", color: TEMPLATE_COLORS.materialPrimary },
  ],
};
const lockElementTemplate: SpriteArtwork = {
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
const fireLock: Sprite = namedSprite("fire_lock", {
  name: "Lock",
  terminal: { layers: [{ char: "╒", color: colors.red }] },
  layers: [
    { char: "\u0106", color: colors.red },
    { char: "∙", color: colors.black },
    { char: ".", color: colors.red },
  ],
});
export const lock = createTemplate("lock", {
  sprite: lockTemplate,
  elementSprite: lockElementTemplate,
});
lock.default.fire = fireLock;
