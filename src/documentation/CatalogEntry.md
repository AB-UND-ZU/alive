# Catalog Entries

Each family uses one `GridTable`: the name occupies the top-left header, variants occupy columns, and sprites, stats and properties occupy rows. Tables scroll horizontally while shared table headers keep the row and column labels visible. Empty values use empty cells.

`ItemCatalogEntry` uses `itemVariants` and the engine's balancing and consumption helpers. `UnitCatalogEntry` compares existing unit definitions, equipment and drop distributions. Original item and unit anchors remain on their corresponding sprite cells.

`CatalogDescription` joins inventory text into flowing paragraphs. Text keeps its original color, sprite runs keep their images and links, and the page width controls wrapping. Name-only fallback descriptions are omitted.
