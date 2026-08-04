import {getGeometry, toSVGPathData} from './mockup-geometry'
import {A4_SIZE_MM, PATTERN_COLOR, PATTERN_LINE_WIDTH_MM, PATTERN_DOT_RADIUS_MM} from './print-constants'

const generatePatternID = (rootName) => rootName + '_' + Math.floor(Math.random() * 1000000)

/*
 * The background pattern is specified in millimetres, so the only thing needed
 * to draw it is how many user units make up a millimetre in this mockup - the
 * same number the PDF export uses, just expressed in the other direction.
 */
const BackgroundPattern = (props) => {
    let backgroundData = props.backgroundData
    if (!backgroundData) {
        return null
    }

    let spacing = backgroundData.patternDimensionInMM * props.userUnitsPerMM
    let strokeWidth = PATTERN_LINE_WIDTH_MM * props.userUnitsPerMM
    let radius = PATTERN_DOT_RADIUS_MM * props.userUnitsPerMM

    if (!spacing || spacing <= 0) {
        return null
    }

    let horizontalRule = <line x1={0} y1={spacing} x2={spacing} y2={spacing}
                               stroke={PATTERN_COLOR} strokeWidth={strokeWidth} />
    let verticalRule = <line x1={spacing} y1={0} x2={spacing} y2={spacing}
                             stroke={PATTERN_COLOR} strokeWidth={strokeWidth} />

    let marks
    if (backgroundData.patternType === 'dots') {
        marks = <circle cx={spacing / 2} cy={spacing / 2} r={radius} fill={PATTERN_COLOR}/>
    } else if (backgroundData.patternType === 'lines') {
        marks = horizontalRule
    } else if (backgroundData.patternType === 'squares') {
        marks = <g>{horizontalRule}{verticalRule}</g>
    } else {
        return null
    }

    return (
        <pattern id={props.patternId} patternUnits="userSpaceOnUse" width={spacing} height={spacing} x={0} y={0}>
            {marks}
        </pattern>
    )
}

const Shape = ({shape, patternFill}) => {
    let fill = shape.fill === 'pattern' ? patternFill : shape.fill
    let stroke = shape.stroke || 'none'

    if (shape.kind === 'canvas' || shape.kind === 'rect') {
        return <rect x={shape.x} y={shape.y} width={shape.width} height={shape.height} rx={shape.rx}
                     stroke={stroke} strokeWidth={shape.strokeWidth} fill={fill}/>
    }
    if (shape.kind === 'circle') {
        return <circle cx={shape.cx} cy={shape.cy} r={shape.r}
                       stroke={stroke} strokeWidth={shape.strokeWidth} fill={fill}/>
    }
    if (shape.kind === 'path') {
        return <path d={toSVGPathData(shape.segments)}
                     stroke={stroke} strokeWidth={shape.strokeWidth} fill={fill}/>
    }
    if (shape.kind === 'text') {
        return <text x={shape.x} y={shape.y} fontSize={shape.fontSize} fill={fill}>{shape.text}</text>
    }
    return null
}

/*
 * Renders a mockup geometry as SVG, sized to fit its pane while keeping its
 * aspect ratio. The `data-mkp-export` attribute is what the PDF export reads
 * back off the DOM: it holds everything needed to rebuild the same geometry.
 */
const MockupSVG = (props) => {
    let {type, geometryArgs, asIcon, pageData, properties} = props

    let geometry = getGeometry(type, {...geometryArgs, asIcon})
    if (!geometry) {
        return null
    }

    let parentWidth = parseInt(props.parentWidth)
    let parentHeight = parseInt(props.parentHeight)
    let parentHeightToWidth = parentHeight / parentWidth

    let svgWidth = parentWidth
    let svgHeight = svgWidth * geometry.aspectHeightToWidth
    if (parentHeightToWidth < geometry.aspectHeightToWidth) {
        svgHeight = parentHeight
        svgWidth = svgHeight / geometry.aspectHeightToWidth
    }

    let [viewBoxX, viewBoxY, viewBoxWidth, viewBoxHeight] = geometry.viewBox

    // preserveAspectRatio="xMidYMid meet" scales the viewBox uniformly to fit
    let pixelsPerUserUnit = Math.min(svgWidth / viewBoxWidth, svgHeight / viewBoxHeight)
    let paperSize = pageData ? (A4_SIZE_MM[pageData.orientation] || A4_SIZE_MM.landscape) : null
    let pixelsPerMM = paperSize ? pageData.width / paperSize.width : 0
    let userUnitsPerMM = pixelsPerUserUnit > 0 ? pixelsPerMM / pixelsPerUserUnit : 0

    let patternId = generatePatternID(type)
    let backgroundData = properties ? properties.backgroundData : null

    let patternFill = `url(#${patternId})`
    if (asIcon || !backgroundData || backgroundData.patternType === 'empty' || !userUnitsPerMM) {
        patternFill = 'white'
    }

    let exportData = null
    if (!asIcon) {
        exportData = JSON.stringify({type, geometryArgs, properties})
    }

    return (
        <svg className={asIcon ? `mkp-svg-${type} mkp-svg-icon` : `mkp-svg-${type} mkp-svg`}
             type={`mkp-svg-${type}`}
             style={{width: svgWidth + 'px', height: svgHeight + 'px'}}
             viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
             preserveAspectRatio="xMidYMid meet"
             data-mkp-export={exportData}>
            <defs>
                <BackgroundPattern patternId={patternId}
                                   backgroundData={asIcon ? null : backgroundData}
                                   userUnitsPerMM={userUnitsPerMM}/>
            </defs>
            {geometry.shapes.map((shape, index) => <Shape key={index} shape={shape} patternFill={patternFill}/>)}
        </svg>
    )
}

export const BrowserMockup = (props) => <MockupSVG {...props} type="browser-mockup"/>

export const TabletMockup = (props) => <MockupSVG {...props} type="tablet-mockup"/>

export const PhoneMockup = (props) => <MockupSVG {...props} type="phone-mockup"/>

export const WatchMockup = (props) => <MockupSVG {...props} type="watch-mockup"/>

// The notes mockup has no fixed shape - it fills whatever pane it is dropped in
export const NotesMockup = (props) => (
    <MockupSVG {...props}
               type="notes-mockup"
               geometryArgs={{
                   width: parseInt(props.parentWidth),
                   height: parseInt(props.parentHeight),
                   hasBorder: !!(props.properties && props.properties.border && props.properties.border.isBorderVisible)
               }}/>
)
