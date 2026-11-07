# forging.ts
<!-- source-types -->

## ForgeOption

```ts src/game/balancing/forging.ts
export type ForgeOption = {
  base: Omit<Item, "carrier" | "bound">;
  add: Omit<Item, "carrier" | "bound">;
  result: Omit<Item, "carrier" | "bound" | "amount">;
};
```

## ForgeOptionResult

```ts src/game/balancing/forging.ts
export type ForgeOptionResult = Omit<ForgeOption, "result"> & {
  result: Omit<Item, "carrier" | "bound">;
};
```

## ForgeStatus

```ts src/game/balancing/forging.ts
export type ForgeStatus = {
  forgeable: boolean;
  duplicate: boolean;
  insufficient?: Omit<Item, "carrier" | "bound">;
  baseItem?: Omit<Item, "carrier" | "bound">;
  addItem?: Omit<Item, "carrier" | "bound">;
  resultItem?: Omit<Item, "carrier" | "bound">;
};
```
