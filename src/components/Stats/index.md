# Stats

Renders player counters, stat rows, and the pause control.

```tsx
StatsInner({
  padding,
  hidden,
  handleQuick,
  width,
  inspecting,
  quick,
  ...stats
}: {
  padding: number;
  hidden: boolean;
  inspecting: boolean;
  quick: boolean;
  width: number;
  handleQuick: (
    event: TouchEvent | React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => void;
} & Partial<Countable> &
  Equippable)
Stats()
```
