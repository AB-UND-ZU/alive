# Light

Vision reveals nearby cells. Terrain and buildings block sight; explored ground remains dim after you leave.

| State   | Visible                                                  |
| ------- | -------------------------------------------------------- |
| Hidden  | Unexplored cells remain covered                          |
| Visible | Terrain, units, items within sight                       |
| Fog     | Previously seen terrain; moving units need current sight |

[[item:torch]] increases vision. Mountains obstruct sight.

## Shadows

Enter a [building](structures.md) to reveal its interior and hide the roof. Outside cells are hidden until you leave.

```scene
light
```
