# Source References

Generates the ignored `src/wiki/sourceReferences.json` from registered source modules. It resolves declaration anchors and local import aliases without changing authored Markdown. The game and wiki start/build commands run it explicitly before stock CRA, including when npm lifecycle hooks are disabled; `wiki:references` refreshes a running preview explicitly.
