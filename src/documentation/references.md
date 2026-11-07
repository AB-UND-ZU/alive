# References

References resolve item and unit names, their plurals, and TypeScript identifiers to documentation anchors. Item sprites link to the same catalog as text references. A decoration can override the displayed name when several places share a sprite, such as towns. Item counts and sprites keep their colors when the linked name changes on hover. Type links use `type-` anchors so a type and a page title can share a name.
<!-- source-types -->

## Reference

```ts src/documentation/references.tsx
export type Reference = {
  href: string;
  kind: "type" | "code" | "item" | "unit" | "feature";
};
```
