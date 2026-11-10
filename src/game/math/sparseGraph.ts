import type { Matrix } from "./matrix";

class PathNode {
  f = 0;
  g = 0;
  h = 0;
  visited = false;
  closed = false;
  parent: PathNode | null = null;

  constructor(public x: number, public y: number, public weight: number) {}

  isWall() {
    return this.weight === 0;
  }

  getCost() {
    return this.weight;
  }
}

// A fresh graph per search isolates mutable terrain and forced endpoint weights.
// Only nodes reached by A* are constructed, in the library's neighbor order.
export class SparseGraph {
  readonly grid: PathNode[][] = [];

  constructor(private matrix: Matrix<number>) {}

  node(x: number, y: number) {
    const column = (this.grid[x] ||= []);
    return (column[y] ||= new PathNode(x, y, this.matrix[x][y]));
  }

  // javascript-astar calls these to reset reused graphs. This graph is single-use.
  cleanDirty() {}
  markDirty() {}

  neighbors({ x, y }: PathNode) {
    const nodes: PathNode[] = [];
    if (x > 0 && y < this.matrix[x - 1].length) nodes.push(this.node(x - 1, y));
    if (x + 1 < this.matrix.length && y < this.matrix[x + 1].length)
      nodes.push(this.node(x + 1, y));
    if (y > 0) nodes.push(this.node(x, y - 1));
    if (y + 1 < this.matrix[x].length) nodes.push(this.node(x, y + 1));
    return nodes;
  }
}
