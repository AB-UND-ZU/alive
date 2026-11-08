# Enter

Updates building membership after entities move. Interior membership determines which roof and outside cells are hidden.

| Data      | Use                                   |
| --------- | ------------------------------------- |
| Layer     | Current structure root                |
| Enterable | Entry appearance and orientation      |
| Fragment  | Resolve a multi-cell structure's root |

Runs after [Movement](movement.md), and checks the relevant entity generation before repeating work. [Visibility](visibility.md) then applies the resulting inside/outside view.
