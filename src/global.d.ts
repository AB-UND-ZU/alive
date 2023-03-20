declare module 'worldmap-generator' {
  export type TileType = {
    name: string,
    connections: Record<string, number>,
  };

  type Size = {
    width: number,
    height: number,
  };

  type GeneratorOptions = {
    size: Size,
    tileTypes: TileType[],
  };

  export type MapCell = {
    name: string,
    resolved: boolean,
    frequencies: Record<string, number>,
  };

  class WorldmapGenerator {
    map: MapCell[][];
    size: Size;

    constructor(options: GeneratorOptions);
    generate();
    getCell(x: number, y: number): MapCell | null;
    resolveMapCell(x: number, y: number, name: string);
  }

  export default WorldmapGenerator;
}