# Saved Worlds

`saveAndLoad` snapshots a small test world, passes it through native V8 cloning, restores it and installs fresh systems. Tests continue playing the restored world to check actions and effects after loading, rather than only comparing serialized data.

V8 cloning preserves `Infinity` and shared references. This Node-only helper stays separate from the harness because Wiki previews import that harness in the browser. Real IndexedDB storage, upgrades and transaction failures are covered separately by the save-storage suites.
