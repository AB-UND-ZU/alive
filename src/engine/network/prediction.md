# Visual prediction

The replica never runs gameplay systems. `createPrediction` stores at most one unconfirmed rendered position in the existing motion layer, leaving POSITION, spatial queries, equipment, resources and gameplay sequences authoritative. Nearby initialized cells and native passability rules prevent prediction through known walls or into missing terrain. The camera can follow the rendered position. Ghost and mounted movement keep their confirmed native behavior rather than predicting only one part of a composite move.

Held movement starts another preview only after confirmation and the character's tick interval. Each view includes the input sequence applied by the server. Matching positions confirm the preview without a second movement; an authoritative displacement, freeze, dialog or elapsed rejected input corrects the existing spring. Realm/actor changes, pause and disconnect clear pending prediction. A lag spike cannot create a speculative movement backlog.

Available spell and skill inputs play a bounded anticipation bump using the existing motion helper, at most once per character tick. It spends nothing and produces no projectile, damage, reward or collision change. Confirmed matching bumps reuse the preview rather than playing twice. Gameplay effects and ability availability come from the server.
