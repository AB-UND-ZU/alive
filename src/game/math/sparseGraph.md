# Sparse pathfinding graph

`findPath` and `findPathSimple` construct a fresh `SparseGraph` for every search. It supplies the existing `javascript-astar` algorithm with nodes lazily, retaining its west/east/south/north neighbor order and weighted movement.

Fresh search state preserves changes to doors and terrain and isolates forced walkable endpoints. The library's dirty-node callbacks are deliberately empty because these graphs are single-use. Reusing a graph across searches is unsupported.

The doubled walkability grid for the 240×240 island contains 230,400 cells. A short search now creates only reached nodes rather than initializing the entire graph. Large unreachable searches can still visit most of the grid; those cases are included in the performance and route comparisons.
