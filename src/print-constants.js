/*
 * Everything that ties the editor to a physical sheet of paper.
 *
 * Lengths that end up on paper are defined in millimetres, once, here - they
 * are converted to screen units for the preview and handed to the PDF export
 * unchanged, so a 5 mm grid measures 5 mm when printed.
 */

export const A4_SIZE_MM = {
    landscape: {width: 297, height: 210},
    portrait: {width: 210, height: 297}
}

// Outlines of the mockups themselves. Below ~0.2 mm most printers drop strokes.
export const OUTLINE_WIDTH_MM = 0.3

export const PATTERN_LINE_WIDTH_MM = 0.25
export const PATTERN_DOT_RADIUS_MM = 0.25

// The same light grey in the two notations the renderers need
export const PATTERN_COLOR = 'rgba(0,0,0,0.25)'
export const PATTERN_GRAY_LEVEL = 191
