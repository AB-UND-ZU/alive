// JSON alone loses Infinity, undefined, cycles and shared component objects.
type Value =
  | null
  | boolean
  | string
  | number
  | ["ref", number]
  | ["number", string]
  | ["undefined"];
type Node = ["array", Value[]] | ["object", [string, Value][]];
type Graph = { root: Value; nodes: Node[] };

export const encodeState = (state: unknown): string => {
  const seen = new Map<object, number>();
  const nodes: Node[] = [];
  const encode = (value: unknown): Value => {
    if (value === undefined) return ["undefined"];
    if (typeof value === "number") {
      if (!Number.isFinite(value) || Object.is(value, -0))
        return ["number", String(Object.is(value, -0) ? "-0" : value)];
      return value;
    }
    if (
      value === null ||
      typeof value === "boolean" ||
      typeof value === "string"
    )
      return value;
    if (typeof value !== "object")
      throw new Error("State must contain only data");
    const previous = seen.get(value);
    if (previous !== undefined) return ["ref", previous];
    const id = nodes.length;
    seen.set(value, id);
    nodes.push(["array", []]);
    if (Array.isArray(value)) nodes[id] = ["array", Array.from(value, encode)];
    else {
      const prototype = Object.getPrototypeOf(value);
      if (prototype && Object.getPrototypeOf(prototype))
        throw new Error("State must contain only plain objects");
      nodes[id] = [
        "object",
        Object.entries(value).map(([key, child]) => [key, encode(child)]),
      ];
    }
    return ["ref", id];
  };
  const root = encode(state);
  return JSON.stringify({ root, nodes });
};

/** Decode trusted server state, never client-authored world data. */
export const decodeState = <T>(message: string): T => {
  const { root, nodes } = JSON.parse(message) as Graph;
  const restored = nodes.map((node) => (node[0] === "array" ? [] : {})) as (
    | unknown[]
    | Record<string, unknown>
  )[];
  const decode = (value: Value): unknown => {
    if (!Array.isArray(value)) return value;
    if (value[0] === "undefined") return undefined;
    if (value[0] === "number") return Number(value[1]);
    if (
      !Number.isSafeInteger(value[1]) ||
      value[1] < 0 ||
      value[1] >= restored.length
    )
      throw new Error("Invalid state reference");
    return restored[value[1]];
  };
  nodes.forEach((node, id) => {
    const target = restored[id];
    if (node[0] === "array") (target as unknown[]).push(...node[1].map(decode));
    else
      node[1].forEach(([key, value]) => {
        Object.defineProperty(target, key, {
          value: decode(value),
          enumerable: true,
          configurable: true,
          writable: true,
        });
      });
  });
  return decode(root) as T;
};
