# geometries.ts
<!-- source-types -->

## Font

```ts src/components/Entity/geometries.ts
type Font = {
  generateShapes: (text: string, size: number) => THREE.Shape[];
};
```
