# Push

Lets a push-capable unit move a displaced object into a free destination.

| Check                                        | Result                                      |
| -------------------------------------------- | ------------------------------------------- |
| Actor action already consumed or unavailable | Skip the push                               |
| Target destination blocked                   | Leave the object in place                   |
| Valid displaced target                       | Move it and consume the actor's action      |
| Idle box or drifting vessel                  | Suspend its movement clock when appropriate |

[Pushable](../components/pushable.md) belongs to the actor; [Displacable](../components/displacable.md) belongs to the moved object. Push runs before [Damage](damage.md) and [Movement](movement.md). Player pushes request a sound on the object; movement consumes the request whether the attempt succeeds or fails, and plays it only for successful movement.
