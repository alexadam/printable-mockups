import { jsPDF } from 'jspdf'

import { getGeometry, toPDFPathOps, shapeBounds } from './mockup-geometry'
import {
    A4_SIZE_MM,
    OUTLINE_WIDTH_MM,
    PATTERN_LINE_WIDTH_MM,
    PATTERN_DOT_RADIUS_MM,
    PATTERN_GRAY_LEVEL
} from './print-constants'

/*
 * Draws the page as PDF vector primitives.
 *
 * Nothing is rasterised: every mockup is rebuilt from its geometry and emitted
 * as PDF paths in millimetres. That keeps the file a few KB, keeps the lines
 * sharp at any zoom or printer resolution, and - because the background
 * patterns are laid out in millimetres directly - makes a 5 mm grid measure
 * 5 mm on paper instead of inheriting the rounding of the screen preview.
 */

// A pattern finer than this is not printable and would emit a useless number of paths
const MIN_PATTERN_SPACING_MM = 0.5

const FOOTER_TEXT = 'Made with https://www.printablemockups.com/'

// Composites a CSS colour over white paper and returns a 0-255 grey level,
// or null when there is nothing to draw.
const toGrayLevel = (color) => {
    if (!color || color === 'none' || color === 'white') {
        return null
    }
    if (color === 'black') {
        return 0
    }
    if (color === 'gray' || color === 'grey') {
        return 128
    }

    let rgba = /^rgba?\(([^)]+)\)$/.exec(color)
    if (rgba) {
        let [red, green, blue, alpha = 1] = rgba[1].split(',').map(Number)
        let luminance = 0.299 * red + 0.587 * green + 0.114 * blue
        return Math.round(255 - alpha * (255 - luminance))
    }

    return 0
}

// Builds the current path without painting it, so it can be filled, stroked or clipped
const buildPath = (doc, shape, transform) => {
    if (shape.kind === 'circle') {
        doc.circle(transform.x(shape.cx), transform.y(shape.cy), transform.radius(shape.r), null)
    } else if (shape.kind === 'path') {
        doc.path(toPDFPathOps(shape.segments, transform))
    } else if (shape.rx) {
        doc.roundedRect(transform.x(shape.x), transform.y(shape.y),
                        transform.width(shape.width), transform.height(shape.height),
                        transform.radius(shape.rx), transform.radius(shape.rx), null)
    } else {
        doc.rect(transform.x(shape.x), transform.y(shape.y),
                 transform.width(shape.width), transform.height(shape.height), null)
    }
}

const paintPath = (doc, style) => doc.internal.out(doc.internal.getStyle(style))

const drawShape = (doc, shape, transform, patternFill) => {
    let fill = shape.fill === 'pattern' ? 'white' : shape.fill
    let strokeLevel = toGrayLevel(shape.stroke)
    let fillLevel = toGrayLevel(fill)

    // white fills matter: they hide the shapes underneath, e.g. the watch belts
    let hasFill = fill && fill !== 'none'
    let style = hasFill && strokeLevel !== null ? 'FD' : (hasFill ? 'F' : (strokeLevel !== null ? 'S' : null))
    if (!style) {
        return
    }

    doc.setFillColor(fillLevel === null ? 255 : fillLevel)
    if (strokeLevel !== null) {
        doc.setDrawColor(strokeLevel)
        doc.setLineWidth(OUTLINE_WIDTH_MM)
    }

    buildPath(doc, shape, transform)
    paintPath(doc, style)

    if (shape.fill === 'pattern' && patternFill) {
        drawPattern(doc, shape, transform, patternFill)
    }
}

/*
 * Lays the pattern out in millimetres over the shape's bounding box, clipped to
 * the shape itself so rounded corners and the phone notch cut it correctly.
 */
const drawPattern = (doc, shape, transform, backgroundData) => {
    let spacing = backgroundData.patternDimensionInMM
    if (!spacing || spacing < MIN_PATTERN_SPACING_MM) {
        return
    }

    let bounds = shapeBounds(shape)
    let left = transform.x(bounds.left)
    let top = transform.y(bounds.top)
    let right = transform.x(bounds.right)
    let bottom = transform.y(bounds.bottom)

    // stay inside the outline so the pattern never sits on top of it
    let inset = OUTLINE_WIDTH_MM
    left += inset
    top += inset
    right -= inset
    bottom -= inset
    if (right <= left || bottom <= top) {
        return
    }

    doc.saveGraphicsState()
    buildPath(doc, shape, transform)
    doc.clip()
    doc.discardPath()

    doc.setFillColor(PATTERN_GRAY_LEVEL)
    doc.setDrawColor(PATTERN_GRAY_LEVEL)
    doc.setLineWidth(PATTERN_LINE_WIDTH_MM)

    if (backgroundData.patternType === 'dots') {
        // A zero-length subpath stroked with round caps is a filled circle
        // (PDF 32000-1, 8.4.3.3). Spelling each dot out as four Bézier curves
        // instead makes a dense grid an order of magnitude heavier.
        doc.setLineCap('round')
        doc.setLineWidth(PATTERN_DOT_RADIUS_MM * 2)
        for (let row = 0; top + (row + 0.5) * spacing <= bottom; row++) {
            for (let column = 0; left + (column + 0.5) * spacing <= right; column++) {
                let x = left + (column + 0.5) * spacing
                let y = top + (row + 0.5) * spacing
                doc.moveTo(x, y)
                doc.lineTo(x, y)
            }
            // one path per row: some printers choke on paths with thousands of segments
            paintPath(doc, 'S')
        }
    } else if (backgroundData.patternType === 'lines' || backgroundData.patternType === 'squares') {
        for (let row = 1; top + row * spacing <= bottom; row++) {
            doc.line(left, top + row * spacing, right, top + row * spacing)
        }
        if (backgroundData.patternType === 'squares') {
            for (let column = 1; left + column * spacing <= right; column++) {
                doc.line(left + column * spacing, top, left + column * spacing, bottom)
            }
        }
    }

    doc.restoreGraphicsState()
}

/*
 * Maps a mockup's user-space units straight to millimetres on the page.
 *
 * The chain is the one the browser applied: the viewBox is fitted into the
 * on-screen element ("xMidYMid meet"), the element sits at a known pixel offset
 * inside the paper, and the paper is exactly one A4 sheet.
 */
const buildTransform = (geometry, rect, paper, paperSizeMM) => {
    let [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = geometry.viewBox

    let mmPerPixelX = paperSizeMM.width / paper.widthPixels
    let mmPerPixelY = paperSizeMM.height / paper.heightPixels

    let pixelsPerUserUnit = Math.min(rect.width / viewBoxWidth, rect.height / viewBoxHeight)
    let originX = rect.left + (rect.width - viewBoxWidth * pixelsPerUserUnit) / 2 - viewBoxX * pixelsPerUserUnit
    let originY = rect.top + (rect.height - viewBoxHeight * pixelsPerUserUnit) / 2 - viewBoxY * pixelsPerUserUnit

    let scaleX = pixelsPerUserUnit * mmPerPixelX
    let scaleY = pixelsPerUserUnit * mmPerPixelY
    let offsetX = (originX - paper.containerOffsetX) * mmPerPixelX
    let offsetY = (originY - paper.containerOffsetY) * mmPerPixelY

    return {
        x: (value) => offsetX + value * scaleX,
        y: (value) => offsetY + value * scaleY,
        width: (value) => value * scaleX,
        height: (value) => value * scaleY,
        radius: (value) => value * (scaleX + scaleY) / 2
    }
}

const drawMockup = (doc, form, paper, paperSizeMM) => {
    let geometry = getGeometry(form.type, form.geometryArgs)
    if (!geometry) {
        return
    }

    let transform = buildTransform(geometry, form.rect, paper, paperSizeMM)

    let backgroundData = form.properties ? form.properties.backgroundData : null
    if (backgroundData && backgroundData.patternType === 'empty') {
        backgroundData = null
    }

    for (let shape of geometry.shapes) {
        // the editor's backdrop only exists to hide neighbouring panes
        if (shape.kind === 'canvas') {
            continue
        }
        if (shape.kind === 'text') {
            doc.setFontSize(transform.height(shape.fontSize) * 72 / 25.4)
            doc.setTextColor(toGrayLevel(shape.fill) || 0)
            doc.text(shape.text, transform.x(shape.x), transform.y(shape.y))
            continue
        }
        drawShape(doc, shape, transform, backgroundData)
    }
}

const buildPDF = (data) => {
    let orientation = data.paper.orientation === 'portrait' ? 'portrait' : 'landscape'
    let paperSizeMM = A4_SIZE_MM[orientation]

    let doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
        // a micrometre is far finer than any printer; the default of 16 decimals
        // only inflates the file
        precision: 3,
        compress: true
    })

    doc.setLineJoin('round')
    doc.setLineCap('butt')

    for (let form of data.forms) {
        drawMockup(doc, form, data.paper, paperSizeMM)
    }

    doc.setFontSize(10)
    doc.setTextColor(0)
    doc.text(FOOTER_TEXT, paperSizeMM.width / 2, paperSizeMM.height - 3, {align: 'center'})

    return doc
}

const createPDF = (data) => buildPDF(data).save('printable-mockups.pdf')

export {createPDF, buildPDF}
