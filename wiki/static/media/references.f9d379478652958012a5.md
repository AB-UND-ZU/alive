# References

Resolves authored references without changing the meaning of literal labels or programming terms.

| Use | Resolution |
| --- | --- |
| ItemView | `item:` plus the existing command key |
| UnitView | `unit:` plus the unit definition key |
| StatLabel | `stat:` plus a documented stat key |
| Development inline code | Exact local/imported symbol or full source path |
| Code fence | Identifier-use metadata from the TypeScript parser; comments and strings stay literal |
| Explicit Markdown link | Authored destination; known entity labels use the native sprite and canonical name |

Separate item and unit keys keep the Head item distinct from the Golem. Automatic gameplay mentions resolve page concepts, while item and unit names use explicit tokens or typed components. Ordinary words such as block keep their meaning. Repeated concept links are omitted within a section. Explicit indexes retain their anchors. Counts and sprites keep their colors while only the linked name changes on hover. Sprite-backed references keep the icon and capitalized label in one link; native description rows retain their original icon when its internal name differs from the printed name. A browser audit checks every player page for missing sprites, lowercase entity names, orphan sprite/name pairs and nested links.

The Map item uses its native yellow equipment sprite. Levels and world-map references use the green warp Map sprite; item references do not inherit that feature icon.
<!-- source-types -->

## Reference

```ts src/wiki/references.tsx
export type Reference = {
  href: string;
  kind: "type" | "code" | "item" | "unit" | "feature";
};
```
