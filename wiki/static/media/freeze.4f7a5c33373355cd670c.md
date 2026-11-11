# Freeze

Applies freezing, changes frozen terrain and handles snow cover before AI and movement run.

| State                    | Work                                                      |
| ------------------------ | --------------------------------------------------------- |
| Affectable freeze amount | Start the freezing sequence                               |
| Freezable terrain        | Freeze or thaw its appearance and behavior                |
| Clicked snow cover       | Remove the snow                                           |
| Sliding unit             | Keep the movement reference active while momentum remains |

`isControllable` is shared with action systems so frozen units cannot act. Snow uses [Coverable](../components/coverable.md); immersion and appearance changes are completed by [Immersion](immersion.md).
