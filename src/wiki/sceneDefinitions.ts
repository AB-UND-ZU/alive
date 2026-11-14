export const sceneDefinitions = {
  clients: {
    title: "Renderer",
    instruction:
      "Move with the arrow keys, cast with Space, or press Enter at the workbench.",
    keys: ["ArrowRight", "ArrowRight", " ", "ArrowLeft", "ArrowLeft"],
  },
  game: {
    title: "Game",
    instruction: "Choose a preset below, then use the normal game controls.",
    keys: [],
  },
  interface: {
    title: "Interface",
    instruction: "The labels identify the game controls.",
    keys: [],
  },
  touch: {
    title: "Touch",
    instruction: "Tap CRAFT to open the workbench, or drag to move.",
    keys: [],
  },
  trading: {
    title: "Shop",
    instruction: "Press Enter to open the trader, then choose Buy or Sell.",
    keys: ["Enter"],
  },
  combat: {
    title: "Melee",
    instruction: "Move right into the enemy to attack with the equipped sword.",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight", "ArrowRight"],
  },
  gear: {
    title: "Gear",
    instruction: "Press G to inspect the equipped gear.",
    keys: ["g"],
  },
  movement: {
    title: "Movement",
    instruction:
      "Follow the maze, collect the Apple, then leave through the opening on the right.",
    keys: [],
  },
  water: {
    title: "Water",
    instruction:
      "Follow the path to the beach, or cross the ice and other ground.",
    keys: Array.from({ length: 8 }, () => "ArrowRight"),
  },
  light: {
    title: "Vision",
    instruction: "Move right to see how the mountain blocks sight.",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight"],
  },
  structures: {
    title: "House",
    instruction: "Enter the house, then move up to the workbench.",
    keys: ["Enter", "ArrowUp", "ArrowUp"],
  },
  pushing: {
    title: "Containers",
    instruction: "Move right into the box to push it toward the wall.",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight"],
  },
  classes: {
    title: "Character",
    instruction: "Press T to inspect this class's stats.",
    keys: ["t"],
  },
  abilities: {
    title: "Spells",
    instruction: "Face right, then press Space to cast the selected spell.",
    keys: ["ArrowRight", " "],
  },
  skills: {
    title: "Skills",
    instruction: "Face right, then press Shift to use the selected skill.",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight", "Shift"],
  },
  harvesting: {
    title: "Tools",
    instruction: "Press Shift, then a direction to use the selected tool.",
    keys: ["Shift", "ArrowRight"],
  },
  farming: {
    title: "Planting",
    instruction: "Press Enter to plant in the prepared soil.",
    keys: ["Enter"],
  },
  fishing: {
    title: "Fishing",
    instruction:
      "Face the water, press Shift, then choose a direction to cast.",
    keys: ["ArrowRight", "ArrowRight", "ArrowRight", "Shift", "ArrowRight"],
  },
  crafting: {
    title: "Crafting",
    instruction: "Press Enter to open the workbench recipes.",
    keys: ["Enter"],
  },
  brewing: {
    title: "Brewing",
    instruction: "Press Enter to open the kettle and choose a recipe.",
    keys: ["Enter", "Enter", "Enter"],
  },
  building: {
    title: "Building",
    instruction: "Press Shift to open the available building plans.",
    keys: ["Shift"],
  },
  food: {
    title: "Food",
    instruction: "Press E to inspect and use the carried food.",
    keys: ["e"],
  },
  forging: {
    title: "Forging",
    instruction: "Choose the wood sword, then Iron, to preview its upgrade.",
    keys: ["Enter", "Enter", "ArrowDown", "Enter"],
  },
  sprites: {
    title: "Sprite Builder",
    instruction:
      "Edit a sprite, add a layer, then choose its color and character.",
    keys: [],
  },
  chat: {
    title: "Chat",
    instruction:
      "Type a command; Tab or a right swipe accepts the gray suggestion.",
    keys: [],
  },
} as const;
export type SceneName = keyof typeof sceneDefinitions;
export const sceneLayout = (name: SceneName) => {
  const topHudRows =
    name === "game" || name === "interface"
      ? 4
      : name === "clients"
      ? 2
      : name === "abilities" || name === "food"
      ? 1
      : 0;
  const rows = name === "game" || name === "interface" ? 20 : 18 + topHudRows;
  return { topHudRows, rows, height: rows * 32 };
};
