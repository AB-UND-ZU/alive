# Catalog Entries

Each family uses one `GridTable`: the name occupies the top-left header, variants occupy columns, and sprites, stats and properties occupy rows. Tables scroll horizontally. Empty values use empty cells.

`ItemCatalogEntry` uses `itemVariants` and the engine's balancing and consumption helpers. `UnitCatalogEntry` compares existing unit definitions, equipment and drop distributions. Original item and unit anchors remain on their corresponding sprite cells.

`CatalogDescription` joins inventory text into flowing paragraphs. Text keeps its original color, sprite runs keep their images and links, and the page width controls wrapping. Name-only fallback descriptions are omitted. Words are grouped before their color runs, so trailing punctuation cannot wrap onto a row by itself.

Numeric-only inventory description rows are omitted when the comparison already shows their values. Negative action costs stay visible. Potion amounts and cooldowns come from `consumptionConfigs`. Drop distributions stay inside each family comparison. Every nonempty probability bundle uses the compact native Frame with a chance label and counted item references, including containers. Portraits in the same comparison share crop bounds; bosses and Golems use the real factory fragments and room diagrams instead of an enlarged single head.

Blocked-slot metadata is omitted from narrative comparisons. Diamond and Ruby resource descriptions keep their native forging text but omit the inherited Mine claim: only Iron and Gold mines are implemented. Golem Limb uses its native dialog icon at one cell; the Golem body diagrams show the factory fragments before and after waking.

Element-only bonuses share an Extra stats row. Totem Aura uses its native icon and four colored stat lines. Food, fish and potion effects use Consume; fish prices come from the engine's sell-price helper. Every item column lists its full-identity acquisition sources through Item Sources, grouped by drop, harvest, quest and recipe. Unsupported acquisition paths stay empty.

Descriptions retain native text and sprite runs. An icon and its printed name share one reference link, including terrain icons whose internal name differs. Known item names in plain text gain their standard references; ordinary blocking instructions remain literal.
