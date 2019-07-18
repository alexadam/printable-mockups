import React from 'react';

const generatePatternID = (rootName) => rootName + '_' + Math.floor(Math.random() * 1000000)

export class PatternSelectorIcon extends React.Component {

    render = () => {
        let patternId = generatePatternID('example')
        let pattern = null
        let patternDim = 20

        if (this.props.type === 'dots') {
            pattern = (
                <pattern id={patternId} patternUnits="userSpaceOnUse" width={patternDim} height={patternDim} x={0} y={0}>
                    <circle cx={patternDim/2} cy={patternDim/2} r={1} fill="black"/>
                </pattern>
            )
        } else if (this.props.type === 'lines') {
            pattern = (
                <pattern id={patternId} patternUnits="userSpaceOnUse" width={patternDim} height={patternDim} x={0} y={0}>
                    <line x1={0} y1={patternDim} x2={patternDim} y2={patternDim} stroke="black" strokeWidth={1} />
                </pattern>
            )
        } else if (this.props.type === 'squares') {
            pattern = (
                <pattern id={patternId} patternUnits="userSpaceOnUse" width={patternDim} height={patternDim} x={0} y={0}>
                    <line x1={0} y1={patternDim} x2={patternDim} y2={patternDim} stroke="black" strokeWidth={1} />
                    <line x1={patternDim} y1={0} x2={patternDim} y2={patternDim} stroke="black" strokeWidth={1} />
                </pattern>
            )
        }

        let dim = 100
        return (
            <svg 
                 type="mkp-svg-pattern-example"
                 style={{width: dim +'px', height: dim + 'px'}}
                 viewBox={"0 0 " + dim + " " + dim}
                 preserveAspectRatio="xMidYMid meet">
                 {pattern}
                <g>
                    <rect x="0" y={0} width={dim} height={dim} stroke="black" strokeWidth={1} fill={`url(#${patternId})`}/>
                </g>
            </svg>
        )
    }
}

class BackgroundPattern extends React.Component {

    render = () => {        

        if (!this.props.backgroundData) {
            return null
        }

        let pattern = null
        if (this.props.backgroundData.patternType === 'dots') {
            return <DotsFillPattern patternId={this.props.patternId} 
                                pageData={this.props.pageData} 
                                mockupDimensions={this.props.mockupDimensions} 
                                patternDimensionInMM={this.props.backgroundData.patternDimensionInMM}/>
        } 
        
        if (this.props.backgroundData.patternType === 'squares') {
            return <SquaresFillPattern patternId={this.props.patternId} 
                                    pageData={this.props.pageData} 
                                    mockupDimensions={this.props.mockupDimensions} 
                                    patternDimensionInMM={this.props.backgroundData.patternDimensionInMM}/>
        }
        
        if (this.props.backgroundData.patternType === 'lines') {
            return <LinesFillPattern patternId={this.props.patternId} 
                                pageData={this.props.pageData} 
                                mockupDimensions={this.props.mockupDimensions} 
                                patternDimensionInMM={this.props.backgroundData.patternDimensionInMM}/>
        }

        return null
    }
}

class SquaresFillPattern extends React.Component {

    render = () => {

        let dimInMM = this.props.patternDimensionInMM
        let strokeWidthInMM = 0.25
        let dimInPixels = 20
        let strokeWidthPixels = 1

        if (this.props.pageData) {
            let A4_Width_MM = 297
            let A4_Height_MM = 210
            if (this.props.pageData.orientation === 'portrait') {
                A4_Width_MM = 210
                A4_Height_MM = 297
            }
            let A4_widthToHeight = 1.414
            let pixelToMMFactor = A4_Width_MM / this.props.pageData.width

            
            dimInPixels = dimInMM * 1 / pixelToMMFactor
            let radiusInPixels = strokeWidthInMM * 1 / pixelToMMFactor

            let mockupDimensions = this.props.mockupDimensions
            if (mockupDimensions) {
                let r = mockupDimensions.svgWidth / mockupDimensions.widthInPixels
                dimInPixels = r * dimInPixels
                strokeWidthPixels = r * radiusInPixels     
            }
        }

        let width = dimInPixels
        let height = dimInPixels
        
        let fillColor = 'rgba(0,0,0, 0.25)'

        return (
            <pattern id={this.props.patternId} patternUnits="userSpaceOnUse" width={width} height={height} x={0} y={0}>
                <line x1={0} y1={height} x2={width} y2={height} stroke={fillColor} strokeWidth={strokeWidthPixels} />
                <line x1={width} y1={0} x2={width} y2={height} stroke={fillColor} strokeWidth={strokeWidthPixels} />
            </pattern>
        )
    }
}

class LinesFillPattern extends React.Component {

    render = () => {

        let dimInMM = this.props.patternDimensionInMM
        let strokeWidthInMM = 0.25
        let dimInPixels = 20
        let strokeWidthPixels = 1

        if (this.props.pageData) {
            let A4_Width_MM = 297
            let A4_Height_MM = 210
            if (this.props.pageData.orientation === 'portrait') {
                A4_Width_MM = 210
                A4_Height_MM = 297
            }
            let A4_widthToHeight = 1.414
            let pixelToMMFactor = A4_Width_MM / this.props.pageData.width

            
            dimInPixels = dimInMM * 1 / pixelToMMFactor
            let radiusInPixels = strokeWidthInMM * 1 / pixelToMMFactor

            let mockupDimensions = this.props.mockupDimensions
            if (mockupDimensions) {
                let r = mockupDimensions.svgWidth / mockupDimensions.widthInPixels
                dimInPixels = r * dimInPixels
                strokeWidthPixels = r * radiusInPixels     
            }
        }

        let width = dimInPixels
        let height = dimInPixels
        
        let fillColor = 'rgba(0,0,0, 0.25)'

        return (
            <pattern id={this.props.patternId} patternUnits="userSpaceOnUse" width={width} height={height} x={0} y={0}>
                <line x1={0} y1={height} x2={width} y2={height} stroke={fillColor} strokeWidth={strokeWidthPixels} />
            </pattern>
        )
    }
}

class DotsFillPattern extends React.Component {

    render = () => {

        let dimInMM = this.props.patternDimensionInMM
        let radiusInMM = 0.25
        let dimInPixels = 20
        let radius = 1.5

        if (this.props.pageData) {
            let A4_Width_MM = 297
            let A4_Height_MM = 210
            if (this.props.pageData.orientation === 'portrait') {
                A4_Width_MM = 210
                A4_Height_MM = 297
            }
            let A4_widthToHeight = 1.414
            let pixelToMMFactor = A4_Width_MM / this.props.pageData.width

            
            dimInPixels = dimInMM * 1 / pixelToMMFactor
            let radiusInPixels = radiusInMM * 1 / pixelToMMFactor

            let mockupDimensions = this.props.mockupDimensions
            if (mockupDimensions) {
                let r = mockupDimensions.svgWidth / mockupDimensions.widthInPixels
                dimInPixels = r * dimInPixels
                radius = r * radiusInPixels     
            }
        }

        let width = dimInPixels
        let height = dimInPixels
        
        let fillColor = 'rgba(0,0,0, 0.25)'

        // <path d="M-1,1 l2,-2
        //          M0,4 l4,-4
        //          M3,5 l2,-2"
        //       stroke="black" strokeWidth="1" />

        return (
            <pattern id={this.props.patternId} patternUnits="userSpaceOnUse" width={width} height={height} x={0} y={0}>
                <circle cx={width-radius} cy={height-radius} r={radius} fill={fillColor}/>
            </pattern>
        )
    }
}

export class BrowserMockup extends React.Component {

    render = () => {
        let patternId = generatePatternID('browser')
        let padding = 20

        let itemWidth = 1920
        let itemHeight = 1200 // 1080
        let topFrameHeight = 60
        let contentHeight = itemHeight - topFrameHeight
        let strokeWidth = 1
        if (this.props.asIcon) {
            strokeWidth = 15
        }

        let topFrame = (
            <g>
                <rect x="0" y="1" width={itemWidth} height={topFrameHeight} stroke="black" strokeWidth={strokeWidth} fill="none" />
                <rect x="160" y="10" width={itemWidth - 175} height={40} rx="10" stroke="black" strokeWidth={strokeWidth} fill="none" />
                <circle cx="40" cy="30" r="10" fill="none" strokeWidth={strokeWidth} stroke="black"/>
                <circle cx="80" cy="30" r="10" fill="none" strokeWidth={strokeWidth} stroke="black"/>
                <circle cx="120" cy="30" r="10" fill="none" strokeWidth={strokeWidth} stroke="black"/>
            </g>
        )
        
        let content = <rect x="0" y={topFrameHeight + 1} width={itemWidth} height={contentHeight} stroke="black" strokeWidth={strokeWidth} fill={`url(#${patternId})`}/>

        let parentWidth = parseInt(this.props.parentWidth)
        let parentHeight = parseInt(this.props.parentHeight)
        let svgRealWidth = 0
        let svgRealHeight = 0

        let parentHWRatio = parentHeight / parentWidth
        let myHWRatio = (itemHeight) / itemWidth

        if (parentHWRatio >= myHWRatio) {
            svgRealWidth = parentWidth
            svgRealHeight = svgRealWidth * myHWRatio
        } else {
            svgRealHeight = parentHeight
            svgRealWidth = svgRealHeight / myHWRatio
        }

        let ww = (svgRealWidth) + 'px'
        let wh = (svgRealHeight) + 'px'
        
        let viewBox = `0 0 ${itemWidth + 10} ${itemHeight + 10}`

        let mockupDimensions = {
            widthInPixels: svgRealWidth,
            heightInPixels: svgRealHeight,
            svgWidth: itemWidth,
            svgHeight: itemHeight
        }

        let classNames = "mkp-svg-browser mkp-svg" 
        if (this.props.asIcon) {
            classNames = "mkp-svg-browser mkp-svg-icon"
        }

        return (
            <svg className={classNames} 
                 type="mkp-svg-browser"
                 style={{width:ww, height:wh}}
                 viewBox={viewBox}
                 preserveAspectRatio="xMidYMid meet">
                <BackgroundPattern patternId={patternId} 
                                pageData={this.props.pageData} 
                                mockupDimensions={mockupDimensions} 
                                backgroundData={this.props.backgroundData}/>
                <g>
                    {topFrame}
                    {content}
                </g>
            </svg>
        )
    }
}

export class PhoneMockup extends React.Component {

    render = () => {
        let patternId = generatePatternID('phone')
        let padding = 20

        let strokeWidth = 1
        if (this.props.asIcon) {
            strokeWidth = 5
        }

        let startX = 0
        let startY = 0
        let phoneHeight = 750
        let phoneWidth = 375
        let phoneHeightToWidthFactor = phoneHeight / phoneWidth
        let phoneRadius = 44
        let framePath = `M${startX},${startY + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${-phoneRadius}
                         H${phoneWidth - phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${phoneRadius}
                         V${phoneHeight - phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${phoneRadius}
                         H${startX + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${-phoneRadius} z
                        `

        let frame = <path d={framePath} fill="none" stroke="black" strokeWidth={strokeWidth}/>

        let phoneBorder = 7

        let contentHeight = phoneHeight - phoneBorder
        phoneWidth = phoneWidth - phoneBorder
        phoneRadius = 40

        let notchRadius = phoneRadius / 3
        let notchHeight = phoneHeight / 35
        let notchWidth = 185
        let notchDist = 41

        let contentPath = `M${startX + phoneBorder},${startY + phoneBorder + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${-phoneRadius}

                         H${startX + phoneBorder + phoneRadius + notchDist}
                         V${startY + phoneBorder + notchHeight}
                         a${notchRadius},${notchRadius},0,0,0,${notchRadius},${notchRadius}
                         H${startX + phoneBorder + phoneRadius + notchDist + notchWidth}
                         a${notchRadius},${notchRadius},0,0,0,${notchRadius},${-notchRadius}
                         V${startY + phoneBorder}
                         H${startX + phoneBorder + phoneRadius + notchDist + notchWidth + notchRadius + notchDist}

                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${phoneRadius}
                         V${contentHeight - phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${phoneRadius}
                         H${startX + phoneBorder + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${-phoneRadius} z`



        let content = <path d={contentPath} fill="none" stroke="black" strokeWidth={strokeWidth} fill={`url(#${patternId})`}/>

        let parentWidth = parseInt(this.props.parentWidth)
        let parentHeight = parseInt(this.props.parentHeight)
        let svgRealWidth = 0
        let svgRealHeight = 0

        let parentHWRatio = parentHeight / parentWidth
        let myHWRatio = (phoneHeight) / phoneWidth

        if (parentHWRatio >= myHWRatio) {
            svgRealWidth = parentWidth
            svgRealHeight = svgRealWidth * myHWRatio 
        } else {
            svgRealHeight = parentHeight
            svgRealWidth = svgRealHeight / myHWRatio
        }

        let ww = (svgRealWidth) + 'px'
        let wh = (svgRealHeight) + 'px'
        let viewBox = `0 0 ${phoneWidth + padding} ${phoneHeight}`

        let mockupDimensions = {
            widthInPixels: svgRealWidth,
            heightInPixels: svgRealHeight,
            svgWidth: phoneWidth,
            svgHeight: phoneHeight
        }



        ////
        ////
        /**
         * 
         *       <defs>
                    <filter x="0" y="0" width="1" height="1" id="solid">
                        <feFlood floodColor="black"/>
                        <feComposite in="SourceGraphic" operator="xor" />
                    </filter>
                </defs>
         */

        ////

        let classNames = "mkp-svg-browser mkp-svg" 
        if (this.props.asIcon) {
            classNames = "mkp-svg-browser mkp-svg-icon"
        }

        return (
            <svg className={classNames} 
                 type="mkp-svg-phone"
                 style={{width:ww, height:wh}}
                 viewBox={viewBox}
                 preserveAspectRatio="xMidYMid meet">
                <BackgroundPattern patternId={patternId} 
                                pageData={this.props.pageData} 
                                mockupDimensions={mockupDimensions} 
                                backgroundData={this.props.backgroundData}/>

                <g>
                    {frame}
                    {content}
                </g>
            </svg>
        )
    }
}


export class WatchMockup extends React.Component {

    render = () => {
        let patternId = generatePatternID('watch')
        let padding = 20

        let watchHeight = 550
        let watchWidth = 470
        let phoneHeightToWidthFactor = watchHeight / watchWidth
        let phoneRadius = 100
        let strokeWidth = 1
        if (this.props.asIcon) {
            strokeWidth = 5
        }

        let frame = <rect x="0" y="100" width={watchWidth} height={watchHeight} rx={phoneRadius} stroke="black" strokeWidth={strokeWidth} fill="none" />
        let innerFrame = <rect x="20" y="120" width="430" height="510" rx="80" stroke="gray" strokeWidth={strokeWidth} fill="none" />
        let content = <rect x="50" y="150" width="368" height="448" rx="70" stroke="black" strokeWidth={strokeWidth} fill={`url(#${patternId})`}/>


        let startX = 80
        let startY = 101
        let bigRadius = phoneRadius * 6
        let beltHeight = 65
        let beltLength =  190
        let beltRadius = 20
        let beltPath = `M${startX},${startY}
                        a${beltRadius},${beltRadius},0,0,0,${beltRadius},${-beltRadius}
                        V${startY - beltRadius - beltHeight}
                        a${bigRadius},${bigRadius},0,0,1,${startX + beltLength},${0}
                        V${startY - beltRadius}
                        a${beltRadius},${beltRadius},0,0,0,${beltRadius},${beltRadius}
                        `

        let belt = <path d={beltPath} fill="none" stroke="black" strokeWidth={strokeWidth}/>
        let bottomBelt = <path d={beltPath} fill="none" stroke="black" strokeWidth={strokeWidth} transform={`scale(1,-1) translate(0, ${-watchHeight*1.365})`}/>



        let parentWidth = parseInt(this.props.parentWidth)
        let parentHeight = parseInt(this.props.parentHeight)
        let svgRealWidth = 0
        let svgRealHeight = 0


        let parentHWRatio = parentHeight / parentWidth
        let myHWRatio = (watchHeight + 2 * (beltHeight + beltRadius)) / watchWidth

        if (parentHWRatio >= myHWRatio) {
            svgRealWidth = parentWidth
            svgRealHeight = svgRealWidth * myHWRatio
        } else {
            svgRealHeight = parentHeight
            svgRealWidth = svgRealHeight / myHWRatio
        }

        let ww = (svgRealWidth) + 'px'
        let wh = (svgRealHeight) + 'px'
        let viewBox = `0 0 ${watchWidth + 5} ${watchHeight + 205 }`

        let mockupDimensions = {
            widthInPixels: svgRealWidth,
            heightInPixels: svgRealHeight,
            svgWidth: watchWidth,
            svgHeight: watchHeight
        }

        let classNames = "mkp-svg-browser mkp-svg" 
        if (this.props.asIcon) {
            classNames = "mkp-svg-browser mkp-svg-icon"
        }

        return (
            <svg className={classNames} 
                 type="mkp-svg-phone"
                 style={{width:ww, height:wh}}
                 viewBox={viewBox}
                 preserveAspectRatio="xMidYMid meet">
                <BackgroundPattern patternId={patternId} 
                                pageData={this.props.pageData} 
                                mockupDimensions={mockupDimensions} 
                                backgroundData={this.props.backgroundData}/>
                <g>
                    {frame}
                    {innerFrame}
                    {content}
                    {belt}
                    {bottomBelt}
                </g>
            </svg>
        )
    }
}
