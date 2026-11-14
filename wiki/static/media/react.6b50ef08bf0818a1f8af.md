# React terminal surface

`TerminalScreen` supplies one cell frame to a terminal React host.
`createTerminalRoot(write)` creates that host and exposes `render` and
`unmount`. A committed frame is encoded as ANSI and passed to `write`.
React components and hooks work without a browser or DOM. The host only
accepts frame surfaces; strings belong inside the frame's cells.

<!-- source-types -->

## Props

```ts src/renderers/terminal/react.ts
type Props = { frame: TerminalFrame };
```

## Node

```ts src/renderers/terminal/react.ts
type Node = { props: Props };
```

## Container

```ts src/renderers/terminal/react.ts
type Container = { children: Node[]; write: (output: string) => void };
```
