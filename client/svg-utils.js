import React from 'react';

class DotsFillPattern extends React.Component {

    render = () => {
        let dim = 10
        if (this.props.dimension) {
            dim = parseInt(this.props.dimension)
        }
        let width = dim
        let height = dim
        let radius = 1
        let fillColor = 'rgba(0,0,0,0.25)'

        // <path d="M-1,1 l2,-2
        //          M0,4 l4,-4
        //          M3,5 l2,-2"
        //       stroke="black" strokeWidth="1" />

        return (
            <pattern id={this.props.patternId} patternUnits="userSpaceOnUse" width={width} height={height}>
                <circle cx={width-radius} cy={height-radius} r={radius} fill={fillColor}/>
            </pattern>
        )
    }
}

export class BrowserMockup extends React.Component {

    render = () => {
        let width = 800
        let height = 600
        let padding = 2
        let viewBox = `0 0 ${width} ${height}`

        let startX = 0
        let startY = 0
        let framePath = `M${startX},${startY}
                         L${width - padding},${startY}
                         L${width - padding},${height - padding}
                         L${startX},${height - padding} z`

        let frame = <path d={framePath} fill="none" stroke="black" strokeWidth="1"/>

        startX = 0
        startY = 50
        let contentPath = `M${startX},${startY}
                         L${width - padding},${startY}
                         L${width - padding},${height - padding}
                         L${startX},${height - padding} z`
        let content = <path d={contentPath} fill="red" stroke="none" strokeWidth="0" fill='url(#pattern1)'/>

        // TODO address bar
        // TODO header

        return (
            <svg style={{width:'100%', height:'100%'}} viewBox={viewBox}>
                <DotsFillPattern patternId="pattern1"/>
                <g >
                    {frame}
                    {content}
                </g>
            </svg>
        )
    }
}

export class PhoneMockup extends React.Component {

    render = () => {
        // let width = 800
        // let height = 600
        let padding = 20
        // let viewBox = `0 0 ${width} ${height}`

        let startX = 0
        let startY = 0
        let phoneHeightToRadiusFactor = 12.67
        let phoneHeight = 750 // 1570
        let phoneWidth = 375 //780
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

        let frame = <path d={framePath} fill="none" stroke="black" strokeWidth="1"/>

        let phoneBorder = 7

        // let contentFrameFactor = 0.99
        let contentHeight = phoneHeight - phoneBorder
        phoneWidth = phoneWidth - phoneBorder
        phoneRadius = 40

        let notchRadius = phoneRadius / 3
        let notchHeight = phoneHeight / 35
        let notchWidth = 185
        let notchDist = 40

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


        let viewBox = `-1 -1 ${phoneWidth + 20} ${phoneHeight + 20}`
        let content = <path d={contentPath} fill="none" stroke="black" strokeWidth="1" fill='url(#pattern2)'/>


        let parentWidth = parseInt(this.props.parentWidth)
        let parentHeight = parseInt(this.props.parentHeight)
        let svgRealWidth = 0
        let svgRealHeight = 0

        if (parentHeight / parentWidth >= phoneHeightToWidthFactor) {
            svgRealWidth = parentWidth  //- padding * 2
            svgRealHeight = phoneHeightToWidthFactor * svgRealWidth
        } else {
            svgRealHeight = parentHeight - padding * 2
            svgRealWidth = svgRealHeight / phoneHeightToWidthFactor
        }
        let ww = (svgRealWidth) + 'px'
        let wh = (svgRealHeight) + 'px'

        return (
            <svg className="mkp-svg-phone mkp-svg" style={{width:ww, height:wh}} viewBox={viewBox} preserveAspectRatio="xMidYMid meet">
                <DotsFillPattern patternId="pattern2"/>
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
        let width = 800
        let height = 600
        let padding = 2
        let viewBox = `0 0 ${width} ${height}`

        let startX = 0
        let startY = 100
        let phoneHeightFactor = 2 //1.324
        let phoneHeightToWidthFactor = 1.17
        let phoneHeightToRadiusFactor = 12.67
        let phoneHeight = height / phoneHeightFactor // 453.14
        let phoneWidth = phoneHeight / phoneHeightToWidthFactor // 205.82
        let phoneRadius = phoneHeight / phoneHeightToRadiusFactor // 35.76
        let framePath = `M${startX},${startY + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${-phoneRadius}
                         H${phoneWidth}
                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${phoneRadius}
                         V${phoneHeight + startY}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${phoneRadius}
                         H${startX + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${-phoneRadius} z
                        `
        let frame = <path d={framePath} fill="none" stroke="black" strokeWidth="1"/>



        startX = 20
        startY = 102
        let bigRadius = phoneRadius * 14
        let beltHeight = 40
        let beltLength = phoneWidth / 1.5
        let beltPath = `M${startX},${startY}
                         a${phoneRadius},${phoneRadius},0,0,0,${phoneRadius},${-phoneRadius}
                         V${startY - phoneRadius - beltHeight}
                         a${bigRadius},${bigRadius},0,0,1,${startX + beltLength},${0}
                         V${startY - phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,0,${phoneRadius},${phoneRadius} z
                        `
        let belt = <path d={beltPath} fill="none" stroke="black" strokeWidth="1"/>

        let bottomBelt = <path d={beltPath} fill="none" stroke="black" strokeWidth="1" transform={`scale(1,-1) translate(0, ${-phoneHeight*1.753})`}/>


        let contentMargin = 10
        startX = 0 + contentMargin
        startY = 100 + contentMargin
        let phoneBorder = 12

        // let contentFrameFactor = 0.99
        let contentHeight = phoneHeight - phoneBorder / 2
        phoneWidth = contentHeight / phoneHeightToWidthFactor - phoneBorder/2
        phoneRadius = contentHeight / phoneHeightToRadiusFactor

        phoneRadius = 10

        let contentPath = `M${startX + phoneBorder},${startY + phoneBorder + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${-phoneRadius}
                         H${phoneWidth}
                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${phoneRadius}
                         V${contentHeight + startY - phoneBorder}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${phoneRadius}
                         H${startX + phoneBorder + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${-phoneRadius} z`


        let content = <path d={contentPath} fill="none" stroke="black" strokeWidth="1" fill='url(#pattern3)'/>

        // {content}
        return (
            <svg style={{width:'100%', height:'100%'}} viewBox={viewBox}>
                <DotsFillPattern patternId="pattern3" dimension={15}/>
                <g >
                    {belt}
                    {frame}
                    {content}
                    {bottomBelt}
                </g>
            </svg>
        )
    }
}
