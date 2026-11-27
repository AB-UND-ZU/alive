import { customSprite } from "../game/assets/spriteIds";
import { displayName } from "./catalog";
import * as ui from "../game/assets/ui";
import { unitDefinitions } from "../game/balancing/units";
import { classDefinitions } from "../game/balancing/classes";
import { useContext, useMemo, useState } from "react";
import * as sprites from "../game/assets/sprites";
import { orientations } from "../engine/components/orientable";
import { Sprite } from "../engine/components/sprite";
import { Button, Input, Pixels, PlainTable, Text } from "./visuals";
import { ReferenceContext } from "./references";

export function spriteVariations() {
  const entries: { key: string; sprite: Sprite; sourceId: string }[] = [];
  const visit = (value: unknown, key: string) => {
    if (!value || typeof value !== "object") return;
    const sprite = value as Sprite;
    if (Array.isArray(sprite.layers)) {
      entries.push({ key, sprite, sourceId: sprite.id });
      for (const [kind, variants] of Object.entries({
        facing: sprite.facing,
        amount: sprite.amounts,
      })) {
        if (!variants) continue;
        // An empty view table inherits the base artwork at every facing or quantity.
        const keys = Object.keys(variants);
        const views = keys.length
          ? keys
          : kind === "facing"
          ? orientations
          : ["single", "double", "multiple"];
        for (const variant of views) {
          const layers =
            (variants as Record<string, Sprite["layers"]>)[variant] ||
            sprite.layers;
          entries.push({
            key: `${key}.${kind}.${variant}`,
            sourceId: sprite.id,
            sprite:
              layers === sprite.layers
                ? sprite
                : customSprite({ name: sprite.name, layers }),
          });
        }
      }
    } else
      for (const [name, child] of Object.entries(value))
        visit(child, key ? `${key}.${name}` : name);
  };
  visit(sprites, "");
  visit(ui, "ui");
  visit(unitDefinitions, "units");
  visit(classDefinitions, "classes");
  return entries;
}
const pageSize = 64;
export function SpriteGallery() {
  const all = useMemo(spriteVariations, []);
  const [query, setQuery] = useState(""),
    [page, setPage] = useState(0);
  const {
    entries,
    features = {},
    decorations = {},
    link,
  } = useContext(ReferenceContext);
  const matches = all.filter(({ key, sprite }) =>
    `${key} ${sprite.name || ""}`.toLowerCase().includes(query.toLowerCase())
  );
  const pages = Math.max(1, Math.ceil(matches.length / pageSize));
  return (
    <section
      className="SpriteGallery"
      aria-label="Existing sprites and variations"
    >
      <Input
        label="Find sprite"
        value={query}
        onChange={(value) => {
          setQuery(value);
          setPage(0);
        }}
      />
      <div className="SpriteGalleryPages">
        <Button disabled={!page} onClick={() => setPage(page - 1)}>
          Previous
        </Button>
        <Text>{`${page + 1} / ${pages}; ${matches.length} variations`}</Text>
        <Button disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>
          Next
        </Button>
      </div>
      <PlainTable
        headers={["Sprite", "Source"]}
        rows={matches
          .slice(page * pageSize, (page + 1) * pageSize)
          .map(({ key, sprite, sourceId }) => {
            const name = (sprite.name || "").toLowerCase();
            const alias = Object.keys(decorations).find(
              (key) => decorations[key].sprite?.id === sourceId
            );
            const unit = key.match(/^units\.([^.]*)\./)?.[1];
            const classKey = key.match(/^classes\.([^.]*)\./)?.[1];
            const sourceUnit = Object.entries(unitDefinitions).find(
              ([, unit]) => unit.sprite.id === sourceId
            )?.[0];
            const reference =
              (unit && entries["unit:" + unit]) ||
              (classKey && entries[classKey]) ||
              (/rotten/i.test(key) && entries["unit:rotten"]) ||
              entries[name] ||
              features[name] ||
              (alias && (entries[alias] || features[alias])) ||
              (name &&
                (entries["unit:" + sourceId] ||
                  (sourceUnit && entries["unit:" + sourceUnit])));
            const view = (
              <Text
                prefix={<Pixels rows={[[sprite]]} label={sprite.name || key} />}
              >
                {sprite.name
                  ? displayName(sprite.name.replace(/_/g, " "))
                  : "Unnamed"}
              </Text>
            );
            return [
              reference ? link(reference.href, view, true) : view,
              <Text code>{key}</Text>,
            ];
          })}
      />
    </section>
  );
}
