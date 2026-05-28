import { Item } from "../../engine/components/item";

export const habitatDistribution = [
  [75, "habitat"],
  [20, "algae"],
  [5, "pearl"],
] as const;

export const fishingDistributionLevels: [
  number,
  Omit<Item, "bound" | "carrier">
][][] = [
  [],
  [
    [54, { stackable: "salmon", amount: 1 }],
    [36, { stackable: "pike", amount: 1 }],
    [6, { stackable: "tuna", amount: 1 }],
    [4, { stackable: "cod", amount: 1 }],
  ],
  [
    [30, { stackable: "salmon", amount: 1 }],
    [20, { stackable: "pike", amount: 1 }],
    [24, { stackable: "tuna", amount: 1 }],
    [16, { stackable: "cod", amount: 1 }],
    [6, { stackable: "eel", amount: 1 }],
    [4, { stackable: "seastar", amount: 1 }],
  ],
  [
    [14, { stackable: "salmon", amount: 1 }],
    [6, { stackable: "pike", amount: 1 }],
    [40, { stackable: "tuna", amount: 1 }],
    [20, { stackable: "cod", amount: 1 }],
    [12, { stackable: "eel", amount: 1 }],
    [8, { stackable: "seastar", amount: 1 }],
  ],
];
