# Structurable

Tracks a multi-cell structure and its fragments.

[Fragment](fragment.md) entities point back to this root. [Damage](../systems/damage.md) and [Enter](../systems/enter.md) resolve the shared structure through those references.

| Field   | Meaning                                                                  |
| ------- | ------------------------------------------------------------------------ |
| `rigid` | Treat structure fragments as one body for movement and collision checks. |
<!-- source-types -->

## Structurable

```ts src/engine/components/structurable.ts
export type Structurable = {
  rigid?: boolean;
};
```
