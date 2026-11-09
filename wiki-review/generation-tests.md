# Generation Test Commands

Normal commands leave out `.generation.test.ts` suites. `test:generation` selects the eight generation suites when level generation or generation fixtures change. Both CI workflows use `test:ci`: one complete Jest coverage run, including generation, with the existing coverage thresholds and reporters.

`test:ci` replaces the former `test:coverage` command. This keeps generation out of normal local checks without splitting coverage into incomplete reports or weakening its gates.

| Command | Suites |
| --- | ---: |
| `npm test` | 176 |
| `npm run test:fast` | 172 |
| `npm run test:slow` | 4 |
| `npm run test:all` | 176 |
| `npm run test:generation` | 8 |
| `npm run test:ci` | 184 |

List-only checks verified every selector: default equals all, all equals fast plus slow, and CI equals all plus generation. Fast, slow and generation are disjoint; no suites were lost. The generation tests retain their tested contents; only filenames and a filename-reference comment changed. Their 56 tests passed in the complete pre-split run; they run again in CI after the rename.

After the split, the normal suite passed 1,508 tests across 176 suites; the inherited save-interaction TODO remains. Full TypeScript/lint and 1,480 fast tests also run through the commit hook. Production game and Wiki builds passed, generating 275 routes. Testing guidance is updated in AGENTS, README and the adjacent harness reference. Version remains 0.5.0.

The 275-route audit checked 6,737 internal links and 5,824 anchors: no broken destinations, duplicate prose/IDs, document overflow, raw tokens, or runtime/HTTP errors. The hidden class name ??? is native content. Measurements: `/tmp/alive-rebase-route-audit.json`. Selector proof: `/tmp/alive-generation-command-verification.json`. Normal test output: `/tmp/alive-generation-normal-tests.log`. The revised harness page is captured at desktop/phone sizes under `/tmp/alive-generation-harness-visual/`.
