# Preview Notes

Centers a scene instruction beside its frame on complete 32-pixel rows. One ResizeObserver watches the frame, note and their grid, so wrapping or changing the viewport recalculates the offset. Below the frame, the note has no centering offset and a full-row gap. Its text wraps within its own grid column.

The note's own text wraps normally even when neighboring terminal sprites preserve whitespace. Resizing between side-by-side and stacked layouts recomputes its offset from the parent grid as well as the frame and text bounds.
