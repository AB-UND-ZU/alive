# Structure Media

Generates a single native building using the same WFC definition as Earth Town and Fire Haven. An air perimeter and centered door select one building; the exported town/haven tile mappings feed the actual cell factories. Layout and palette come from the engine rather than a documentation drawing.

The native assignBuilding helper finds the connected facade and door. worldRows renders the exterior and passes the native inside flag to getSegments for the corresponding interior sprites. The snapshots are cached for the page lifetime. Portal and Lever specimens use their actual createCell factories; neither has an ATTACKABLE component.
