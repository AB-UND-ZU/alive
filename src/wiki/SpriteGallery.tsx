import * as ui from "../game/assets/ui";
import { unitDefinitions } from "../game/balancing/units";
import { classDefinitions } from "../game/balancing/classes";
import { useContext, useMemo, useState } from "react";
import * as sprites from "../game/assets/sprites";
import { Sprite } from "../engine/components/sprite";
import { Button, Input, Pixels, PlainTable, Text } from "./visuals";
import { ReferenceContext } from "./references";

export function spriteVariations() {
  const entries: { key: string; sprite: Sprite }[] = [];
  const visit = (value: unknown, key: string) => {
    if (!value || typeof value !== "object") return;
    const sprite = value as Sprite;
    if (Array.isArray(sprite.layers)) {
      entries.push({
        key,
        sprite: { name: sprite.name, layers: sprite.layers },
      });
      for (const [kind, variants] of Object.entries({
        facing: sprite.facing,
        amount: sprite.amounts,
      }))
        for (const [variant, layers] of Object.entries(variants || {}))
          if (layers)
            entries.push({
              key: `${key}.${kind}.${variant}`,
              sprite: { name: sprite.name, layers },
            });
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
    `${key} ${sprite.name}`.toLowerCase().includes(query.toLowerCase())
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
          .map(({ key, sprite }) => {
            const name = sprite.name.toLowerCase();
            const alias =
              name &&
              Object.keys(decorations).find(
                (key) => decorations[key].sprite?.name.toLowerCase() === name
              );
            const unit = key.match(/^units\.([^.]*)\./)?.[1];
            const classKey = key.match(/^classes\.([^.]*)\./)?.[1];
            const reference =
              (unit && entries["unit:" + unit]) ||
              (classKey && entries[classKey]) ||
              (/rotten/i.test(key) && entries["unit:rotten"]) ||
              entries[name] ||
              features[name] ||
              (alias && (entries[alias] || features[alias]));
            const view = (
              <Text
                prefix={<Pixels rows={[[sprite]]} label={sprite.name || key} />}
              >
                {sprite.name || "Unnamed"}
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
