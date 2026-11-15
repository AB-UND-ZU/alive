# Snapshot wire encoding

`encodeState` produces a JSON-ready object graph for plain game data. The transport serializes its complete message once, instead of embedding an already serialized snapshot inside another JSON string. Shared objects and cycles use reference indices. Special numbers and undefined use tagged values, preserving component identity and values such as infinite stat caps across a WebSocket or JSON file boundary.

`decodeState` reconstructs trusted server data. It is not an input schema and must never be used to accept client-authored world state. Object properties are defined directly so keys such as `__proto__` remain data. Functions and non-plain objects are rejected by the encoder.

Snapshot creation and restoration still belong to `engine/snapshot.ts`. The codec neither filters entities nor changes IDs or gameplay state. Its native-world test verifies movement after an encoded snapshot is restored, including shared spawn/viewpoint data.
<!-- source-types -->

## Value

```ts src/engine/network/codec.ts
type Value =
  | null
  | boolean
  | string
  | number
  | ["ref", number]
  | ["number", string]
  | ["undefined"];
```

## Node

```ts src/engine/network/codec.ts
type Node = ["array", Value[]] | ["object", [string, Value][]];
```

## Graph

```ts src/engine/network/codec.ts
type Graph = { root: Value; nodes: Node[] };
```
