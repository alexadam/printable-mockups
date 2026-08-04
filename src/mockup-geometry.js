/*
 * Geometry of every mockup, defined once, in its own user-space units.
 *
 * Both renderers consume these descriptions: svg-utils.jsx turns them into SVG
 * for the editor, svg-pdf.js turns them into PDF vector primitives. A single
 * definition is what keeps the printed page identical to the screen.
 *
 * Shapes are drawn in array order. Supported kinds:
 *   canvas - full-bleed white backdrop of the editor, never printed
 *   rect   - x, y, width, height, optional rx (rounded corners)
 *   circle - cx, cy, r
 *   path   - segments, see PathBuilder
 *   text   - x, y, fontSize, text
 * `fill: 'pattern'` marks the shape that carries the background pattern.
 */

const round = (value) => Math.round(value * 10000) / 10000

/*
 * Builds a path out of absolute segments:
 *   ['M', x, y] ['L', x, y] ['A', radius, sweep, x, y] ['Z']
 * Arcs are always circular and never span more than half a circle, which is
 * true of every arc drawn here and lets us skip the large-arc flag.
 */
class PathBuilder {

    constructor() {
        this.segments = []
        this.x = 0
        this.y = 0
    }

    moveTo = (x, y) => {
        this.segments.push(['M', x, y])
        this.x = x
        this.y = y
        return this
    }

    lineTo = (x, y) => {
        this.segments.push(['L', x, y])
        this.x = x
        this.y = y
        return this
    }

    horizontalTo = (x) => this.lineTo(x, this.y)

    verticalTo = (y) => this.lineTo(this.x, y)

    // relative arc, same shape as the SVG 'a' command
    arc = (radius, sweep, dx, dy) => {
        this.x += dx
        this.y += dy
        this.segments.push(['A', radius, sweep, this.x, this.y])
        return this
    }

    close = () => {
        this.segments.push(['Z'])
        return this
    }
}

export const toSVGPathData = (segments) => segments.map((segment) => {
    let [command, ...args] = segment
    if (command === 'A') {
        let [radius, sweep, x, y] = args
        return `A${round(radius)},${round(radius)},0,0,${sweep},${round(x)},${round(y)}`
    }
    if (command === 'Z') {
        return 'z'
    }
    return command + args.map(round).join(',')
}).join(' ')

// Mirrors a path over a horizontal axis; arcs keep their shape by flipping sweep.
const mirrorOverY = (segments, axisY) => segments.map((segment) => {
    let [command, ...args] = segment
    if (command === 'A') {
        let [radius, sweep, x, y] = args
        return ['A', radius, sweep ? 0 : 1, x, 2 * axisY - y]
    }
    if (command === 'Z') {
        return ['Z']
    }
    return [command, args[0], 2 * axisY - args[1]]
})

/*
 * Splits a circular arc into cubic Béziers - PDF has no arc operator.
 * Follows the endpoint-to-center conversion of the SVG spec (F.6.5).
 */
const arcToCurves = (x0, y0, radius, sweep, x1, y1) => {
    let halfChordX = (x0 - x1) / 2
    let halfChordY = (y0 - y1) / 2
    let halfChordLengthSq = halfChordX * halfChordX + halfChordY * halfChordY

    if (halfChordLengthSq === 0) {
        return []
    }

    // an arc too small to reach its endpoints is grown until it just fits
    radius = Math.max(radius, Math.sqrt(halfChordLengthSq))

    let centerDistance = Math.sqrt(Math.max(0, radius * radius / halfChordLengthSq - 1))
    // sign is '+' when largeArc differs from sweep - largeArc is always 0 here
    let centerSign = sweep ? 1 : -1
    let centerX = (x0 + x1) / 2 + centerSign * centerDistance * halfChordY
    let centerY = (y0 + y1) / 2 - centerSign * centerDistance * halfChordX

    let startAngle = Math.atan2(y0 - centerY, x0 - centerX)
    let endAngle = Math.atan2(y1 - centerY, x1 - centerX)
    let sweepAngle = endAngle - startAngle
    if (sweep && sweepAngle < 0) {
        sweepAngle += 2 * Math.PI
    }
    if (!sweep && sweepAngle > 0) {
        sweepAngle -= 2 * Math.PI
    }

    // a quarter circle per Bézier keeps the error far below print resolution
    let steps = Math.max(1, Math.ceil(Math.abs(sweepAngle) / (Math.PI / 2)))
    let stepAngle = sweepAngle / steps
    let handleLength = 4 / 3 * Math.tan(stepAngle / 4)

    let curves = []
    for (let step = 0; step < steps; step++) {
        let angleA = startAngle + step * stepAngle
        let angleB = angleA + stepAngle
        let pointAX = centerX + radius * Math.cos(angleA)
        let pointAY = centerY + radius * Math.sin(angleA)
        let pointBX = centerX + radius * Math.cos(angleB)
        let pointBY = centerY + radius * Math.sin(angleB)

        curves.push([
            pointAX - handleLength * radius * Math.sin(angleA),
            pointAY + handleLength * radius * Math.cos(angleA),
            pointBX + handleLength * radius * Math.sin(angleB),
            pointBY - handleLength * radius * Math.cos(angleB),
            pointBX,
            pointBY
        ])
    }

    return curves
}

/*
 * Flattens path segments into the operator list jsPDF's doc.path() expects,
 * mapping each point through `transform` on the way out.
 */
export const toPDFPathOps = (segments, transform) => {
    let ops = []
    let x = 0
    let y = 0

    for (let [command, ...args] of segments) {
        if (command === 'M' || command === 'L') {
            let [nextX, nextY] = args
            ops.push({op: command === 'M' ? 'm' : 'l', c: [transform.x(nextX), transform.y(nextY)]})
            x = nextX
            y = nextY
        } else if (command === 'A') {
            let [radius, sweep, nextX, nextY] = args
            for (let curve of arcToCurves(x, y, radius, sweep, nextX, nextY)) {
                ops.push({op: 'c', c: [
                    transform.x(curve[0]), transform.y(curve[1]),
                    transform.x(curve[2]), transform.y(curve[3]),
                    transform.x(curve[4]), transform.y(curve[5])
                ]})
            }
            x = nextX
            y = nextY
        } else if (command === 'Z') {
            ops.push({op: 'h', c: []})
        }
    }

    return ops
}

/*
 * Bounding box of a shape in user units. For paths the Bézier control points
 * are included, so the box can be slightly generous - callers only use it to
 * lay out a clipped background pattern.
 */
export const shapeBounds = (shape) => {
    if (shape.kind === 'circle') {
        return {left: shape.cx - shape.r, top: shape.cy - shape.r, right: shape.cx + shape.r, bottom: shape.cy + shape.r}
    }
    if (shape.kind !== 'path') {
        return {left: shape.x, top: shape.y, right: shape.x + shape.width, bottom: shape.y + shape.height}
    }

    let identity = {x: (value) => value, y: (value) => value}
    let bounds = {left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity}
    for (let {c} of toPDFPathOps(shape.segments, identity)) {
        for (let index = 0; index < c.length; index += 2) {
            bounds.left = Math.min(bounds.left, c[index])
            bounds.right = Math.max(bounds.right, c[index])
            bounds.top = Math.min(bounds.top, c[index + 1])
            bounds.bottom = Math.max(bounds.bottom, c[index + 1])
        }
    }
    return bounds
}

// The white backdrop that hides whatever sits behind a mockup in the editor.
const canvas = (width, height) => ({
    kind: 'canvas',
    x: -width / 2, y: -height / 2,
    width: width * 2, height: height * 2,
    fill: 'white', stroke: null
})

const browserGeometry = ({asIcon = false} = {}) => {
    let itemWidth = 1920
    let itemHeight = 1200
    let topFrameHeight = 60
    let contentHeight = itemHeight - topFrameHeight
    let strokeWidth = asIcon ? 15 : 1

    return {
        viewBox: [0, 0, itemWidth + 10, itemHeight + 10],
        contentWidth: itemWidth,
        contentHeight: itemHeight,
        aspectHeightToWidth: itemHeight / itemWidth,
        shapes: [
            canvas(itemWidth, itemHeight),
            {kind: 'rect', x: 0, y: 1, width: itemWidth, height: topFrameHeight,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'rect', x: 160, y: 10, width: itemWidth - 175, height: 40, rx: 10,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'circle', cx: 40, cy: 30, r: 10, stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'circle', cx: 80, cy: 30, r: 10, stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'circle', cx: 120, cy: 30, r: 10, stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'rect', x: 0, y: topFrameHeight + 1, width: itemWidth, height: contentHeight,
             stroke: 'black', strokeWidth, fill: 'pattern'}
        ]
    }
}

const tabletGeometry = ({asIcon = false} = {}) => {
    let itemWidth = 560
    let itemHeight = 430
    let padding = asIcon ? 24 : 12
    let strokeWidth = asIcon ? 5 : 1

    return {
        viewBox: [-1, -1, itemWidth + 10, itemHeight + 10],
        contentWidth: itemWidth,
        contentHeight: itemHeight,
        aspectHeightToWidth: itemHeight / itemWidth,
        shapes: [
            canvas(itemWidth, itemHeight),
            {kind: 'rect', x: 0, y: 0, width: itemWidth, height: itemHeight, rx: 20,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'rect', x: padding, y: padding,
             width: itemWidth - 2 * padding, height: itemHeight - 2 * padding, rx: 10,
             stroke: 'black', strokeWidth, fill: 'pattern'}
        ]
    }
}

const phoneGeometry = ({asIcon = false} = {}) => {
    let padding = 20
    let strokeWidth = asIcon ? 5 : 1

    let startX = 0
    let startY = 0
    let phoneHeight = 750
    let phoneWidth = 375
    let phoneRadius = 44

    let frame = new PathBuilder()
        .moveTo(startX, startY + phoneRadius)
        .arc(phoneRadius, 1, phoneRadius, -phoneRadius)
        .horizontalTo(phoneWidth - phoneRadius)
        .arc(phoneRadius, 1, phoneRadius, phoneRadius)
        .verticalTo(phoneHeight - phoneRadius)
        .arc(phoneRadius, 1, -phoneRadius, phoneRadius)
        .horizontalTo(startX + phoneRadius)
        .arc(phoneRadius, 1, -phoneRadius, -phoneRadius)
        .close()

    let phoneBorder = 7
    let contentHeight = phoneHeight - phoneBorder
    phoneWidth = phoneWidth - phoneBorder
    phoneRadius = 40

    let notchRadius = phoneRadius / 3
    let notchHeight = phoneHeight / 35
    let notchWidth = 185
    let notchDist = 41

    let screen = new PathBuilder()
        .moveTo(startX + phoneBorder, startY + phoneBorder + phoneRadius)
        .arc(phoneRadius, 1, phoneRadius, -phoneRadius)
        .horizontalTo(startX + phoneBorder + phoneRadius + notchDist)
        .verticalTo(startY + phoneBorder + notchHeight)
        .arc(notchRadius, 0, notchRadius, notchRadius)
        .horizontalTo(startX + phoneBorder + phoneRadius + notchDist + notchWidth)
        .arc(notchRadius, 0, notchRadius, -notchRadius)
        .verticalTo(startY + phoneBorder)
        .horizontalTo(startX + phoneBorder + phoneRadius + notchDist + notchWidth + notchRadius + notchDist)
        .arc(phoneRadius, 1, phoneRadius, phoneRadius)
        .verticalTo(contentHeight - phoneRadius)
        .arc(phoneRadius, 1, -phoneRadius, phoneRadius)
        .horizontalTo(startX + phoneBorder + phoneRadius)
        .arc(phoneRadius, 1, -phoneRadius, -phoneRadius)
        .close()

    return {
        viewBox: [-1, -1, phoneWidth + padding, phoneHeight],
        contentWidth: phoneWidth,
        contentHeight: phoneHeight,
        aspectHeightToWidth: phoneHeight / phoneWidth,
        shapes: [
            canvas(phoneWidth, phoneHeight),
            {kind: 'path', segments: frame.segments, stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'path', segments: screen.segments, stroke: 'black', strokeWidth, fill: 'pattern'}
        ]
    }
}

const watchGeometry = ({asIcon = false} = {}) => {
    let watchHeight = 550
    let watchWidth = 470
    let frameRadius = 100
    let strokeWidth = asIcon ? 5 : 1

    let startX = 80
    let startY = 100
    let bigRadius = frameRadius * 6
    let beltHeight = 65
    let beltLength = 190
    let beltRadius = 20

    let belt = new PathBuilder()
        .moveTo(startX, startY)
        .arc(beltRadius, 0, beltRadius, -beltRadius)
        .verticalTo(startY - beltRadius - beltHeight)
        .arc(bigRadius, 1, startX + beltLength, 0)
        .verticalTo(startY - beltRadius)
        .arc(beltRadius, 0, beltRadius, beltRadius)

    return {
        viewBox: [-1, -1, watchWidth + 5, watchHeight + 205],
        contentWidth: watchWidth,
        contentHeight: watchHeight,
        aspectHeightToWidth: (watchHeight + 2 * (beltHeight + beltRadius)) / watchWidth,
        shapes: [
            canvas(watchWidth, watchHeight),
            {kind: 'rect', x: 0, y: 100, width: watchWidth, height: watchHeight, rx: frameRadius,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'rect', x: 20, y: 120, width: 430, height: 510, rx: 80,
             stroke: 'gray', strokeWidth, fill: 'white'},
            {kind: 'rect', x: 50, y: 150, width: 368, height: 448, rx: 70,
             stroke: 'black', strokeWidth, fill: 'pattern'},
            {kind: 'path', segments: belt.segments, stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'path', segments: mirrorOverY(belt.segments, watchHeight * 1.365 / 2),
             stroke: 'black', strokeWidth, fill: 'white'}
        ]
    }
}

const notesGeometry = ({asIcon = false, width = 100, height = 100, hasBorder = false} = {}) => {
    let strokeWidth = 1
    let stroke = hasBorder ? 'rgba(0,0,0,0.75)' : 'white'
    if (asIcon) {
        stroke = 'black'
    }

    let shapes = [
        canvas(width, height),
        {kind: 'rect', x: 1, y: 1, width, height, stroke, strokeWidth, fill: 'pattern'}
    ]
    if (asIcon) {
        shapes.push({kind: 'text', x: 10, y: 55, fontSize: 28, text: 'Notes', fill: 'black'})
    }

    return {
        viewBox: [0, 0, width + 10, height + 10],
        contentWidth: width,
        contentHeight: height,
        aspectHeightToWidth: height / width,
        shapes
    }
}

const GEOMETRIES = {
    'browser-mockup': browserGeometry,
    'tablet-mockup': tabletGeometry,
    'phone-mockup': phoneGeometry,
    'watch-mockup': watchGeometry,
    'notes-mockup': notesGeometry
}

export const getGeometry = (type, args = {}) => {
    let geometry = GEOMETRIES[type]
    return geometry ? geometry(args) : null
}
