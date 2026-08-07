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

/*
 * Laptop and monitor are the same screen block on different supports, so they
 * share one function - `variant` only decides what holds the screen up.
 */
const desktopGeometry = ({asIcon = false, variant = 'laptop'} = {}) => {
    let isLaptop = variant === 'laptop'
    let bodyWidth = 1000
    let bodyHeight = 640
    let strokeWidth = asIcon ? 10 : 1

    // a monitor keeps a chin below the screen, a laptop a strip above it for the camera
    let screenTop = isLaptop ? 36 : 24
    let screenBottom = isLaptop ? 22 : 66
    let screenSide = isLaptop ? 22 : 24

    let shapes = [
        canvas(bodyWidth, bodyHeight),
        {kind: 'rect', x: 0, y: 0, width: bodyWidth, height: bodyHeight, rx: isLaptop ? 18 : 12,
         stroke: 'black', strokeWidth, fill: 'white'},
        {kind: 'rect', x: screenSide, y: screenTop,
         width: bodyWidth - 2 * screenSide, height: bodyHeight - screenTop - screenBottom, rx: 6,
         stroke: 'black', strokeWidth, fill: 'pattern'}
    ]

    let bottom
    if (isLaptop) {
        shapes.push({kind: 'circle', cx: bodyWidth / 2, cy: screenTop / 2, r: 6,
                     stroke: 'black', strokeWidth, fill: 'white'})

        // the base is a shallow trapezoid with the usual dip at the front to lift the lid
        let baseHeight = 54
        let notchHalfWidth = 62
        let notchDepth = 16
        bottom = bodyHeight + baseHeight

        let base = new PathBuilder()
            .moveTo(-26, bodyHeight)
            .horizontalTo(bodyWidth / 2 - notchHalfWidth)
            .lineTo(bodyWidth / 2 - notchHalfWidth + notchDepth, bodyHeight + notchDepth)
            .horizontalTo(bodyWidth / 2 + notchHalfWidth - notchDepth)
            .lineTo(bodyWidth / 2 + notchHalfWidth, bodyHeight)
            .horizontalTo(bodyWidth + 26)
            .lineTo(bodyWidth + 76, bottom)
            .horizontalTo(-76)
            .close()

        shapes.push({kind: 'path', segments: base.segments, stroke: 'black', strokeWidth, fill: 'white'})
    } else {
        shapes.push({kind: 'circle', cx: bodyWidth - 44, cy: bodyHeight - screenBottom / 2, r: 5,
                     stroke: 'black', strokeWidth, fill: 'white'})

        let neckWidth = 110
        let neckHeight = 72
        let footHeight = 26
        bottom = bodyHeight + neckHeight + footHeight

        shapes.push({kind: 'rect', x: (bodyWidth - neckWidth) / 2, y: bodyHeight,
                     width: neckWidth, height: neckHeight, stroke: 'black', strokeWidth, fill: 'white'})
        shapes.push({kind: 'rect', x: bodyWidth / 2 - 180, y: bodyHeight + neckHeight,
                     width: 360, height: footHeight, rx: footHeight / 2,
                     stroke: 'black', strokeWidth, fill: 'white'})
    }

    let left = isLaptop ? -82 : -6
    let viewBoxWidth = isLaptop ? bodyWidth + 164 : bodyWidth + 12

    return {
        viewBox: [left, -6, viewBoxWidth, bottom + 12],
        contentWidth: bodyWidth,
        contentHeight: bottom,
        aspectHeightToWidth: (bottom + 12) / viewBoxWidth,
        shapes
    }
}

/*
 * A flat slab with a punch-hole camera - the generic Android-style phone, as
 * opposed to the notched iPhone above. The nav bar is optional.
 */
const androidGeometry = ({asIcon = false, hasNavBar = true} = {}) => {
    let phoneWidth = 380
    let phoneHeight = 780
    let border = 12
    let strokeWidth = asIcon ? 5 : 1

    let screenWidth = phoneWidth - 2 * border
    let screenHeight = phoneHeight - 2 * border
    let centerX = phoneWidth / 2

    let shapes = [
        canvas(phoneWidth, phoneHeight),
        {kind: 'rect', x: 0, y: 0, width: phoneWidth, height: phoneHeight, rx: 34,
         stroke: 'black', strokeWidth, fill: 'white'},
        {kind: 'rect', x: border, y: border, width: screenWidth, height: screenHeight, rx: 24,
         stroke: 'black', strokeWidth, fill: 'pattern'},
        {kind: 'circle', cx: centerX, cy: border + 28, r: 10, stroke: 'black', strokeWidth, fill: 'white'}
    ]

    if (hasNavBar) {
        let navTop = phoneHeight - border - 52
        let glyphY = navTop + 26
        let glyphHalf = 12
        let glyphSpacing = 48

        let separator = new PathBuilder()
            .moveTo(border, navTop)
            .horizontalTo(phoneWidth - border)

        let back = new PathBuilder()
            .moveTo(centerX - glyphSpacing + glyphHalf, glyphY - glyphHalf)
            .verticalTo(glyphY + glyphHalf)
            .lineTo(centerX - glyphSpacing - glyphHalf, glyphY)
            .close()

        shapes.push({kind: 'path', segments: separator.segments, stroke: 'black', strokeWidth, fill: 'none'})
        shapes.push({kind: 'path', segments: back.segments, stroke: 'black', strokeWidth, fill: 'white'})
        shapes.push({kind: 'circle', cx: centerX, cy: glyphY, r: glyphHalf,
                     stroke: 'black', strokeWidth, fill: 'white'})
        shapes.push({kind: 'rect', x: centerX + glyphSpacing - glyphHalf, y: glyphY - glyphHalf,
                     width: 2 * glyphHalf, height: 2 * glyphHalf, rx: 3,
                     stroke: 'black', strokeWidth, fill: 'white'})
    }

    return {
        viewBox: [-6, -6, phoneWidth + 12, phoneHeight + 12],
        contentWidth: phoneWidth,
        contentHeight: phoneHeight,
        aspectHeightToWidth: (phoneHeight + 12) / (phoneWidth + 12),
        shapes
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

/*
 * A 16:9 screen in a thin bezel. The stand is optional: without it the frame
 * doubles as a bare slide, which is the other half of what this shape is for.
 */
const tvGeometry = ({asIcon = false, hasStand = true} = {}) => {
    let screenWidth = 1600
    let screenHeight = 900
    let bezel = 26
    let bodyWidth = screenWidth + 2 * bezel
    let bodyHeight = screenHeight + 2 * bezel
    let strokeWidth = asIcon ? 14 : 1

    let shapes = [
        canvas(bodyWidth, bodyHeight),
        {kind: 'rect', x: 0, y: 0, width: bodyWidth, height: bodyHeight, rx: 16,
         stroke: 'black', strokeWidth, fill: 'white'},
        {kind: 'rect', x: bezel, y: bezel, width: screenWidth, height: screenHeight, rx: 4,
         stroke: 'black', strokeWidth, fill: 'pattern'}
    ]

    let bottom = bodyHeight
    if (hasStand) {
        let neckHeight = 88
        let neckTopHalf = 96
        let neckBottomHalf = 156
        let footHeight = 32
        let footHalf = 340
        let centerX = bodyWidth / 2
        bottom = bodyHeight + neckHeight + footHeight

        let neck = new PathBuilder()
            .moveTo(centerX - neckTopHalf, bodyHeight)
            .lineTo(centerX - neckBottomHalf, bodyHeight + neckHeight)
            .horizontalTo(centerX + neckBottomHalf)
            .lineTo(centerX + neckTopHalf, bodyHeight)
            .close()

        shapes.push({kind: 'path', segments: neck.segments, stroke: 'black', strokeWidth, fill: 'white'})
        shapes.push({kind: 'rect', x: centerX - footHalf, y: bodyHeight + neckHeight,
                     width: 2 * footHalf, height: footHeight, rx: footHeight / 2,
                     stroke: 'black', strokeWidth, fill: 'white'})
    }

    return {
        viewBox: [-8, -8, bodyWidth + 16, bottom + 16],
        contentWidth: bodyWidth,
        contentHeight: bottom,
        aspectHeightToWidth: (bottom + 16) / (bodyWidth + 16),
        shapes
    }
}

/*
 * A dialog on its own: title bar with a close glyph, a body to sketch in and a
 * footer holding the two buttons every dialog ends with.
 */
const modalGeometry = ({asIcon = false} = {}) => {
    let cardWidth = 720
    let cardHeight = 500
    let titleHeight = 74
    let footerHeight = 98
    let padding = 26
    let strokeWidth = asIcon ? 8 : 1

    let titleRule = new PathBuilder()
        .moveTo(0, titleHeight)
        .horizontalTo(cardWidth)

    let footerRule = new PathBuilder()
        .moveTo(0, cardHeight - footerHeight)
        .horizontalTo(cardWidth)

    // the line to write the dialog's title on, stopping short of the close glyph
    let titleLine = new PathBuilder()
        .moveTo(padding, titleHeight - 20)
        .horizontalTo(cardWidth - padding - 70)

    let closeX = cardWidth - padding - 20
    let closeY = titleHeight / 2
    let closeHalf = 13
    let closeFirst = new PathBuilder()
        .moveTo(closeX - closeHalf, closeY - closeHalf)
        .lineTo(closeX + closeHalf, closeY + closeHalf)
    let closeSecond = new PathBuilder()
        .moveTo(closeX + closeHalf, closeY - closeHalf)
        .lineTo(closeX - closeHalf, closeY + closeHalf)

    let buttonWidth = 156
    let buttonHeight = 50
    let buttonGap = 18
    let buttonY = cardHeight - footerHeight + (footerHeight - buttonHeight) / 2
    let secondButtonX = cardWidth - padding - buttonWidth
    let firstButtonX = secondButtonX - buttonGap - buttonWidth

    return {
        viewBox: [-8, -8, cardWidth + 16, cardHeight + 16],
        contentWidth: cardWidth,
        contentHeight: cardHeight,
        aspectHeightToWidth: (cardHeight + 16) / (cardWidth + 16),
        shapes: [
            canvas(cardWidth, cardHeight),
            {kind: 'rect', x: 0, y: 0, width: cardWidth, height: cardHeight, rx: 18,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'path', segments: titleRule.segments, stroke: 'black', strokeWidth, fill: 'none'},
            {kind: 'path', segments: titleLine.segments, stroke: 'gray', strokeWidth, fill: 'none'},
            {kind: 'path', segments: closeFirst.segments, stroke: 'black', strokeWidth, fill: 'none'},
            {kind: 'path', segments: closeSecond.segments, stroke: 'black', strokeWidth, fill: 'none'},
            {kind: 'rect', x: padding, y: titleHeight + padding,
             width: cardWidth - 2 * padding,
             height: cardHeight - titleHeight - footerHeight - 2 * padding, rx: 6,
             stroke: 'black', strokeWidth, fill: 'pattern'},
            {kind: 'path', segments: footerRule.segments, stroke: 'black', strokeWidth, fill: 'none'},
            {kind: 'rect', x: firstButtonX, y: buttonY, width: buttonWidth, height: buttonHeight, rx: 8,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'rect', x: secondButtonX, y: buttonY, width: buttonWidth, height: buttonHeight, rx: 8,
             stroke: 'black', strokeWidth, fill: 'white'}
        ]
    }
}

/*
 * The round watch: a circular face is a different sketching surface from the
 * rectangular one above, not a re-skin of it. Straps and crown are drawn first
 * so the white case fills over the ends that should be hidden underneath it.
 */
const roundWatchGeometry = ({asIcon = false} = {}) => {
    let caseRadius = 240
    let bezelRadius = 226
    let faceRadius = 210
    let strapLength = 170
    let strapWidth = 224
    let strapRadius = 26
    let strapOverlap = 70
    let crownWidth = 30
    let crownHeight = 58
    let strokeWidth = asIcon ? 8 : 1

    let centerX = caseRadius
    let centerY = strapLength + caseRadius
    let totalHeight = 2 * (strapLength + caseRadius)
    let strapX = centerX - strapWidth / 2
    let crownLeft = centerX + caseRadius - 10
    let right = crownLeft + crownWidth

    return {
        viewBox: [-8, -8, right + 16, totalHeight + 16],
        contentWidth: right,
        contentHeight: totalHeight,
        aspectHeightToWidth: (totalHeight + 16) / (right + 16),
        shapes: [
            canvas(right, totalHeight),
            {kind: 'rect', x: crownLeft, y: centerY - crownHeight / 2,
             width: crownWidth, height: crownHeight, rx: 8,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'rect', x: strapX, y: 0,
             width: strapWidth, height: strapLength + strapOverlap, rx: strapRadius,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'rect', x: strapX, y: totalHeight - strapLength - strapOverlap,
             width: strapWidth, height: strapLength + strapOverlap, rx: strapRadius,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'circle', cx: centerX, cy: centerY, r: caseRadius,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'circle', cx: centerX, cy: centerY, r: bezelRadius,
             stroke: 'gray', strokeWidth, fill: 'white'},
            {kind: 'circle', cx: centerX, cy: centerY, r: faceRadius,
             stroke: 'black', strokeWidth, fill: 'pattern'}
        ]
    }
}

/*
 * A square to annotate a flow with. The dog-eared corner is cut out of the
 * outline and the flap laid back over it, which is what reads as "folded";
 * without the fold the same shape is a plain index card.
 */
const stickyNoteGeometry = ({asIcon = false, hasFold = true} = {}) => {
    let size = 520
    let fold = 96
    let strokeWidth = asIcon ? 8 : 1

    let outline = new PathBuilder().moveTo(0, 0).horizontalTo(size)

    if (hasFold) {
        outline.verticalTo(size - fold).lineTo(size - fold, size)
    } else {
        outline.verticalTo(size)
    }

    outline.horizontalTo(0).close()

    let shapes = [
        canvas(size, size),
        {kind: 'path', segments: outline.segments, stroke: 'black', strokeWidth, fill: 'pattern'}
    ]

    if (hasFold) {
        // the flap, filled white so the pattern stops at the fold
        let flap = new PathBuilder()
            .moveTo(size, size - fold)
            .lineTo(size - fold, size)
            .verticalTo(size - fold)
            .close()
        shapes.push({kind: 'path', segments: flap.segments, stroke: 'black', strokeWidth, fill: 'white'})
    }

    return {
        viewBox: [-8, -8, size + 16, size + 16],
        contentWidth: size,
        contentHeight: size,
        aspectHeightToWidth: 1,
        shapes
    }
}

const clampCount = (value, min, max) => {
    let count = Math.round(Number(value))
    if (!Number.isFinite(count)) {
        return min
    }
    return Math.min(max, Math.max(min, count))
}

// One cell of the storyboard: a small device outline with a pattern screen.
const storyboardFrame = (frame, x, y, width, height, strokeWidth) => {
    if (frame === 'browser') {
        let chromeHeight = 26
        return [
            {kind: 'rect', x, y, width, height: chromeHeight, stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'circle', cx: x + 12, cy: y + chromeHeight / 2, r: 4, stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'circle', cx: x + 26, cy: y + chromeHeight / 2, r: 4, stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'rect', x: x + 40, y: y + 7, width: width - 52, height: 12, rx: 6,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'rect', x, y: y + chromeHeight, width, height: height - chromeHeight,
             stroke: 'black', strokeWidth, fill: 'pattern'}
        ]
    }

    let border = 10
    return [
        {kind: 'rect', x, y, width, height, rx: 20, stroke: 'black', strokeWidth, fill: 'white'},
        {kind: 'rect', x: x + border, y: y + border,
         width: width - 2 * border, height: height - 2 * border, rx: 12,
         stroke: 'black', strokeWidth, fill: 'pattern'}
    ]
}

/*
 * A sheet of small numbered frames with a ruled caption under each one - how a
 * flow gets sketched on paper. Every frame carries its own pattern region.
 */
const storyboardGeometry = ({asIcon = false, columns = 3, rows = 2, frame = 'phone'} = {}) => {
    let isBrowser = frame === 'browser'
    let strokeWidth = asIcon ? 6 : 1

    // the menu icon shows a single strip, which is what makes the shape readable
    columns = asIcon ? 3 : clampCount(columns, 1, 6)
    rows = asIcon ? 1 : clampCount(rows, 1, 6)

    let frameWidth = 260
    let frameHeight = isBrowser ? 175 : 460
    let gapX = 46
    let gapY = 44
    let captionGap = 20
    let captionHeight = 40
    let numberWidth = 40

    let cellHeight = frameHeight + captionGap + captionHeight
    let sheetWidth = columns * frameWidth + (columns - 1) * gapX
    let sheetHeight = rows * cellHeight + (rows - 1) * gapY

    let shapes = [canvas(sheetWidth, sheetHeight)]

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            let x = column * (frameWidth + gapX)
            let y = row * (cellHeight + gapY)
            let captionY = y + frameHeight + captionGap + captionHeight / 2

            shapes.push(...storyboardFrame(frame, x, y, frameWidth, frameHeight, strokeWidth))

            let caption = new PathBuilder()
                .moveTo(asIcon ? x : x + numberWidth, captionY)
                .horizontalTo(x + frameWidth)
            shapes.push({kind: 'path', segments: caption.segments, stroke: 'black', strokeWidth, fill: 'none'})

            if (!asIcon) {
                shapes.push({kind: 'text', x: x + 4, y: captionY - 6, fontSize: 26,
                             text: String(row * columns + column + 1) + '.', fill: 'black'})
            }
        }
    }

    return {
        viewBox: [-6, -6, sheetWidth + 12, sheetHeight + 12],
        contentWidth: sheetWidth,
        contentHeight: sheetHeight,
        aspectHeightToWidth: (sheetHeight + 12) / (sheetWidth + 12),
        shapes
    }
}

/*
 * The ruled header every printed drawing sheet has: labelled boxes to fill in
 * by hand. As an icon it sits at the foot of a page outline, which is both what
 * it looks like on paper and the only way a 12:1 bar reads at menu size.
 */
const titleBlockGeometry = ({asIcon = false} = {}) => {
    let barWidth = 1200
    let barHeight = 110
    let labelHeight = 36
    let fontSize = 22
    let strokeWidth = asIcon ? 10 : 1

    // Project gets the most room, Sheet the least - the widths are fractions of the bar
    let fields = [
        {label: 'Project', width: 0.26},
        {label: 'Screen', width: 0.22},
        {label: 'Date', width: 0.14},
        {label: 'Version', width: 0.12},
        {label: 'Author', width: 0.16},
        {label: 'Sheet', width: 0.10}
    ]

    let sheetTop = asIcon ? barWidth * 0.75 - barHeight : 0
    let shapes = [canvas(barWidth, sheetTop + barHeight)]

    if (asIcon) {
        shapes.push({kind: 'rect', x: 0, y: 0, width: barWidth, height: sheetTop + barHeight,
                     stroke: 'black', strokeWidth, fill: 'white'})
    }

    shapes.push({kind: 'rect', x: 0, y: sheetTop, width: barWidth, height: barHeight,
                 stroke: 'black', strokeWidth, fill: 'white'})

    // the rule that separates the printed labels from the space to write in
    let labelRule = new PathBuilder()
        .moveTo(0, sheetTop + labelHeight)
        .horizontalTo(barWidth)
    shapes.push({kind: 'path', segments: labelRule.segments, stroke: 'black', strokeWidth, fill: 'none'})

    let x = 0
    for (let field of fields) {
        if (x > 0) {
            let divider = new PathBuilder()
                .moveTo(x, sheetTop)
                .verticalTo(sheetTop + barHeight)
            shapes.push({kind: 'path', segments: divider.segments, stroke: 'black', strokeWidth, fill: 'none'})
        }

        if (!asIcon) {
            shapes.push({kind: 'text', x: x + 12, y: sheetTop + labelHeight - 11, fontSize,
                         text: field.label, fill: 'black'})
            if (field.label === 'Sheet') {
                // short enough to stay inside the narrowest box in Helvetica
                shapes.push({kind: 'text', x: x + 12, y: sheetTop + barHeight - 26, fontSize,
                             text: '__ of __', fill: 'black'})
            }
        }

        x += field.width * barWidth
    }

    let height = sheetTop + barHeight
    return {
        viewBox: [-6, -6, barWidth + 12, height + 12],
        contentWidth: barWidth,
        contentHeight: height,
        aspectHeightToWidth: (height + 12) / (barWidth + 12),
        shapes
    }
}

/*
 * A book-style foldable, opened flat: one body carrying two screens with the
 * hinge running between them. Each panel is its own pattern region, so a flow
 * can be sketched across the fold the way the real UI splits.
 */
const foldableGeometry = ({asIcon = false} = {}) => {
    let bodyWidth = 1180
    let bodyHeight = 820
    let border = 16
    let hingeGap = 18
    let strokeWidth = asIcon ? 12 : 1

    let panelWidth = (bodyWidth - 2 * border - hingeGap) / 2
    let panelHeight = bodyHeight - 2 * border
    let rightPanelX = border + panelWidth + hingeGap
    let centerX = bodyWidth / 2

    let hinge = new PathBuilder()
        .moveTo(centerX, 0)
        .verticalTo(bodyHeight)

    return {
        viewBox: [-6, -6, bodyWidth + 12, bodyHeight + 12],
        contentWidth: bodyWidth,
        contentHeight: bodyHeight,
        aspectHeightToWidth: (bodyHeight + 12) / (bodyWidth + 12),
        shapes: [
            canvas(bodyWidth, bodyHeight),
            {kind: 'rect', x: 0, y: 0, width: bodyWidth, height: bodyHeight, rx: 28,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'rect', x: border, y: border, width: panelWidth, height: panelHeight, rx: 14,
             stroke: 'black', strokeWidth, fill: 'pattern'},
            {kind: 'rect', x: rightPanelX, y: border, width: panelWidth, height: panelHeight, rx: 14,
             stroke: 'black', strokeWidth, fill: 'pattern'},
            {kind: 'path', segments: hinge.segments, stroke: 'gray', strokeWidth, fill: 'none'},
            {kind: 'circle', cx: rightPanelX + panelWidth / 2, cy: border + 30, r: 10,
             stroke: 'black', strokeWidth, fill: 'white'}
        ]
    }
}

/*
 * The wide dashboard screen of a car. The control row below the screen - two
 * knobs and the hard keys between them - is what makes it read as a dashboard
 * rather than a letterboxed tablet, but it is optional.
 */
const carGeometry = ({asIcon = false, hasControls = true} = {}) => {
    let bodyWidth = 1600
    let bodyHeight = 700
    let bezel = 26
    let controlBarHeight = hasControls ? 96 : 0
    let strokeWidth = asIcon ? 12 : 1

    let shapes = [
        canvas(bodyWidth, bodyHeight),
        {kind: 'rect', x: 0, y: 0, width: bodyWidth, height: bodyHeight, rx: 44,
         stroke: 'black', strokeWidth, fill: 'white'},
        {kind: 'rect', x: bezel, y: bezel,
         width: bodyWidth - 2 * bezel, height: bodyHeight - 2 * bezel - controlBarHeight, rx: 20,
         stroke: 'black', strokeWidth, fill: 'pattern'}
    ]

    if (hasControls) {
        let centerY = bodyHeight - bezel - controlBarHeight / 2
        let knobRadius = 30
        let keyWidth = 130
        let keyHeight = 36
        let keyGap = 30
        let keyCount = 3
        let keysWidth = keyCount * keyWidth + (keyCount - 1) * keyGap

        shapes.push({kind: 'circle', cx: bezel + 60, cy: centerY, r: knobRadius,
                     stroke: 'black', strokeWidth, fill: 'white'})
        shapes.push({kind: 'circle', cx: bodyWidth - bezel - 60, cy: centerY, r: knobRadius,
                     stroke: 'black', strokeWidth, fill: 'white'})

        for (let key = 0; key < keyCount; key++) {
            shapes.push({kind: 'rect',
                         x: (bodyWidth - keysWidth) / 2 + key * (keyWidth + keyGap),
                         y: centerY - keyHeight / 2,
                         width: keyWidth, height: keyHeight, rx: keyHeight / 2,
                         stroke: 'black', strokeWidth, fill: 'white'})
        }
    }

    return {
        viewBox: [-8, -8, bodyWidth + 16, bodyHeight + 16],
        contentWidth: bodyWidth,
        contentHeight: bodyHeight,
        aspectHeightToWidth: (bodyHeight + 16) / (bodyWidth + 16),
        shapes
    }
}

/*
 * A standing kiosk: a portrait screen with a chin for the card reader, on a
 * pedestal. Dropping the pedestal leaves the wall-mounted version.
 */
const kioskGeometry = ({asIcon = false, hasStand = true} = {}) => {
    let bodyWidth = 620
    let bodyHeight = 900
    let side = 28
    let top = 32
    let chinHeight = 96
    let strokeWidth = asIcon ? 8 : 1

    let centerX = bodyWidth / 2
    let chinTop = bodyHeight - chinHeight
    let slotWidth = 220
    let slotHeight = 24

    let shapes = [
        canvas(bodyWidth, bodyHeight),
        {kind: 'rect', x: 0, y: 0, width: bodyWidth, height: bodyHeight, rx: 22,
         stroke: 'black', strokeWidth, fill: 'white'},
        {kind: 'rect', x: side, y: top,
         width: bodyWidth - 2 * side, height: bodyHeight - top - chinHeight, rx: 10,
         stroke: 'black', strokeWidth, fill: 'pattern'},
        // the card reader slot, the one part of a POS terminal that is never on screen
        {kind: 'rect', x: centerX - slotWidth / 2, y: chinTop + (chinHeight - slotHeight) / 2,
         width: slotWidth, height: slotHeight, rx: slotHeight / 2,
         stroke: 'black', strokeWidth, fill: 'white'}
    ]

    let bottom = bodyHeight
    if (hasStand) {
        let neckHeight = 110
        let neckTopHalf = 120
        let neckBottomHalf = 170
        let footHeight = 34
        let footHalf = 300
        bottom = bodyHeight + neckHeight + footHeight

        let neck = new PathBuilder()
            .moveTo(centerX - neckTopHalf, bodyHeight)
            .lineTo(centerX - neckBottomHalf, bodyHeight + neckHeight)
            .horizontalTo(centerX + neckBottomHalf)
            .lineTo(centerX + neckTopHalf, bodyHeight)
            .close()

        shapes.push({kind: 'path', segments: neck.segments, stroke: 'black', strokeWidth, fill: 'white'})
        shapes.push({kind: 'rect', x: centerX - footHalf, y: bodyHeight + neckHeight,
                     width: 2 * footHalf, height: footHeight, rx: footHeight / 2,
                     stroke: 'black', strokeWidth, fill: 'white'})
    }

    return {
        viewBox: [-8, -8, bodyWidth + 16, bottom + 16],
        contentWidth: bodyWidth,
        contentHeight: bottom,
        aspectHeightToWidth: (bottom + 16) / (bodyWidth + 16),
        shapes
    }
}

/*
 * A terminal window: the same window chrome as the browser, but the interior is
 * meant to be ruled rather than gridded - a lines pattern is what it ships with.
 * The prompt is drawn as a path, not text, so it survives at menu-icon size.
 */
const terminalGeometry = ({asIcon = false} = {}) => {
    let windowWidth = 1400
    let windowHeight = 900
    let titleHeight = 56
    let strokeWidth = asIcon ? 12 : 1

    let buttonY = titleHeight / 2
    let titleRule = new PathBuilder()
        .moveTo(windowWidth / 2 - 150, buttonY)
        .horizontalTo(windowWidth / 2 + 150)

    let promptY = titleHeight + 46
    let promptHalf = 15
    let chevron = new PathBuilder()
        .moveTo(30, promptY - promptHalf)
        .lineTo(30 + promptHalf + 4, promptY)
        .lineTo(30, promptY + promptHalf)

    return {
        viewBox: [-6, -6, windowWidth + 12, windowHeight + 12],
        contentWidth: windowWidth,
        contentHeight: windowHeight,
        aspectHeightToWidth: (windowHeight + 12) / (windowWidth + 12),
        shapes: [
            canvas(windowWidth, windowHeight),
            {kind: 'rect', x: 0, y: 0, width: windowWidth, height: titleHeight,
             stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'circle', cx: 34, cy: buttonY, r: 11, stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'circle', cx: 70, cy: buttonY, r: 11, stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'circle', cx: 106, cy: buttonY, r: 11, stroke: 'black', strokeWidth, fill: 'white'},
            {kind: 'path', segments: titleRule.segments, stroke: 'gray', strokeWidth, fill: 'none'},
            {kind: 'rect', x: 0, y: titleHeight, width: windowWidth, height: windowHeight - titleHeight,
             stroke: 'black', strokeWidth, fill: 'pattern'},
            {kind: 'path', segments: chevron.segments, stroke: 'black', strokeWidth, fill: 'none'},
            // the block cursor, the only solid mark on the sheet
            {kind: 'rect', x: 70, y: promptY - 16, width: 20, height: 32,
             stroke: 'black', strokeWidth, fill: 'black'}
        ]
    }
}

// The widget sizes of one sheet, as rows of spans on the home-screen grid.
const WIDGET_LAYOUTS = {
    mixed: [[4], [2, 2]],
    small: [[2, 2], [2, 2]],
    wide: [[4], [4]]
}

/*
 * Home-screen widget outlines at their real proportions: a span of n grid cells
 * plus the gaps between them, with a caption rule under each to label it.
 */
const widgetsGeometry = ({asIcon = false, layout = 'mixed'} = {}) => {
    let cell = 140
    let gap = 24
    let rowGap = 44
    let captionGap = 16
    let captionHeight = 34
    let strokeWidth = asIcon ? 8 : 1

    let rows = WIDGET_LAYOUTS[asIcon ? 'mixed' : layout] || WIDGET_LAYOUTS.mixed
    let span = (cells) => cells * cell + (cells - 1) * gap

    let widgetHeight = span(2)
    let rowHeight = widgetHeight + captionGap + captionHeight
    let sheetWidth = Math.max(...rows.map((row) =>
        row.reduce((total, cells) => total + span(cells), 0) + (row.length - 1) * gap))
    let sheetHeight = rows.length * rowHeight + (rows.length - 1) * rowGap

    let shapes = [canvas(sheetWidth, sheetHeight)]

    rows.forEach((row, rowIndex) => {
        let y = rowIndex * (rowHeight + rowGap)
        let x = 0

        for (let cells of row) {
            let width = span(cells)

            shapes.push({kind: 'rect', x, y, width, height: widgetHeight, rx: 32,
                         stroke: 'black', strokeWidth, fill: 'pattern'})

            let caption = new PathBuilder()
                .moveTo(x, y + widgetHeight + captionGap + captionHeight / 2)
                .horizontalTo(x + width)
            shapes.push({kind: 'path', segments: caption.segments, stroke: 'gray', strokeWidth, fill: 'none'})

            x += width + gap
        }
    })

    return {
        viewBox: [-6, -6, sheetWidth + 12, sheetHeight + 12],
        contentWidth: sheetWidth,
        contentHeight: sheetHeight,
        aspectHeightToWidth: (sheetHeight + 12) / (sheetWidth + 12),
        shapes
    }
}

/*
 * The headset field of view: two overlapping circular lenses. The outline is
 * their union, drawn as one path so the pattern inside is continuous and lines
 * up across the stereo overlap; the two inner caps are then drawn in gray to
 * show where each eye's view ends.
 */
const vrGeometry = ({asIcon = false} = {}) => {
    let lensRadius = 340
    let lensDistance = 440
    let strokeWidth = asIcon ? 12 : 1

    let leftX = lensRadius
    let rightX = lensRadius + lensDistance
    let centerX = leftX + lensDistance / 2
    let centerY = lensRadius
    let totalWidth = 2 * lensRadius + lensDistance
    let totalHeight = 2 * lensRadius

    // where the two circles cross, measured from their shared vertical centre line
    let crossHalfHeight = Math.sqrt(lensRadius * lensRadius - lensDistance * lensDistance / 4)
    let topY = centerY - crossHalfHeight

    // counter-clockwise around the union: left circle's outer half, then the right's
    let outline = new PathBuilder()
        .moveTo(centerX, topY)
        .arc(lensRadius, 0, -centerX, crossHalfHeight)
        .arc(lensRadius, 0, centerX, crossHalfHeight)
        .arc(lensRadius, 0, totalWidth - centerX, -crossHalfHeight)
        .arc(lensRadius, 0, centerX - totalWidth, -crossHalfHeight)
        .close()

    let leftCap = new PathBuilder()
        .moveTo(centerX, topY)
        .arc(lensRadius, 1, leftX + lensRadius - centerX, crossHalfHeight)
        .arc(lensRadius, 1, centerX - leftX - lensRadius, crossHalfHeight)

    let rightCap = new PathBuilder()
        .moveTo(centerX, topY)
        .arc(lensRadius, 0, rightX - lensRadius - centerX, crossHalfHeight)
        .arc(lensRadius, 0, centerX - rightX + lensRadius, crossHalfHeight)

    return {
        viewBox: [-8, -8, totalWidth + 16, totalHeight + 16],
        contentWidth: totalWidth,
        contentHeight: totalHeight,
        aspectHeightToWidth: (totalHeight + 16) / (totalWidth + 16),
        shapes: [
            canvas(totalWidth, totalHeight),
            {kind: 'path', segments: outline.segments, stroke: 'black', strokeWidth, fill: 'pattern'},
            {kind: 'path', segments: leftCap.segments, stroke: 'gray', strokeWidth, fill: 'none'},
            {kind: 'path', segments: rightCap.segments, stroke: 'gray', strokeWidth, fill: 'none'}
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
        // The box is sized from the icon's pixel size, so the label has to be
        // derived from it too - a fixed font size only fitted the 100-unit box
        // this happened to be drawn in. 'Notes' is ~2.61em wide in Helvetica.
        const labelEmWidth = 2.61
        let fontSize = Math.min(width * 0.8 / labelEmWidth, height * 0.4)
        let labelWidth = fontSize * labelEmWidth
        shapes.push({kind: 'text',
                     x: 1 + (width - labelWidth) / 2,
                     y: 1 + height / 2 + fontSize * 0.36,
                     fontSize, text: 'Notes', fill: 'black'})
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
    'laptop-mockup': (args) => desktopGeometry({...args, variant: 'laptop'}),
    'monitor-mockup': (args) => desktopGeometry({...args, variant: 'monitor'}),
    'tv-mockup': tvGeometry,
    'car-mockup': carGeometry,
    'kiosk-mockup': kioskGeometry,
    'terminal-mockup': terminalGeometry,
    'tablet-mockup': tabletGeometry,
    'phone-mockup': phoneGeometry,
    'android-mockup': androidGeometry,
    'foldable-mockup': foldableGeometry,
    'widgets-mockup': widgetsGeometry,
    'vr-mockup': vrGeometry,
    'watch-mockup': watchGeometry,
    'round-watch-mockup': roundWatchGeometry,
    'modal-mockup': modalGeometry,
    'storyboard-mockup': storyboardGeometry,
    'title-block-mockup': titleBlockGeometry,
    'sticky-note-mockup': stickyNoteGeometry,
    'notes-mockup': notesGeometry
}

export const getGeometry = (type, args = {}) => {
    let geometry = GEOMETRIES[type]
    return geometry ? geometry(args) : null
}
