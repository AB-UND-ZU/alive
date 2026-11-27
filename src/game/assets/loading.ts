import { mapDiscovery, soundNotes } from "./sprites/particles";
import { addBackground, createDialog, recolorSprite } from "./ui";
import { colors } from "./colors";
import { formatGameVersion } from "./version";

export const updateLoading = (version: string) =>
  createDialog(`Updating ${formatGameVersion(version).toLowerCase()}...`);

export const mapLoading = createDialog("Loading map...");

const loadingMap = recolorSprite(mapDiscovery, { [colors.black]: colors.white });

export const worldLoading = (name: string) =>
  createDialog(
    "Loading ",
    addBackground([loadingMap]),
    name + "..."
  );

export const soundsLoading = (current?: number, total?: number) => {
  const count = total === undefined ? "" : `${current}/${total}`;
  return createDialog(
    "Loading ",
    addBackground([soundNotes]),
    count + "..."
  );
};
