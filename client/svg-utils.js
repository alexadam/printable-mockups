import React from 'react';

class DotsFillPattern extends React.Component {

    render = () => {
        let dim = 10
        let width = dim
        let height = dim
        let radius = 1
        let fillColor = 'rgba(0,0,0,0.25)'

        // <path d="M-1,1 l2,-2
        //          M0,4 l4,-4
        //          M3,5 l2,-2"
        //       stroke="black" strokeWidth="1" />

        return (
            <pattern id="dotsPattern" patternUnits="userSpaceOnUse" width={width} height={height}>
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
        let framePath = `M${startX + padding},${startY + padding}
                         L${width - padding},${startY + padding}
                         L${width - padding},${height - padding}
                         L${startX + padding},${height - padding} z`

        let frame = <path d={framePath} fill="none" stroke="black" strokeWidth="1"/>

        startX = 0
        startY = 50
        let contentPath = `M${startX + padding},${startY + padding}
                         L${width - padding},${startY + padding}
                         L${width - padding},${height - padding}
                         L${startX + padding},${height - padding} z`
        let content = <path d={contentPath} fill="red" stroke="none" strokeWidth="0" fill='url(#dotsPattern)'/>

        // TODO address bar
        // TODO header

        return (
            <svg style={{width:'100%', height:'100%'}} viewBox={viewBox}>
                <DotsFillPattern/>
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
        // let height = 800
        // let padding = 2
        // let viewBox = `0 0 ${width} ${height}`
        //
        // let startX = 0
        // let startY = 0
        // let cornerRadius = ${phoneRadius}
        // let tHeight = 473.14
        // let tWidth = 185.82
        // let whf = 2.03
        // let radiusFactorHeight = 11.6
        // let framePath2 = `
        //                 M476.33,153.43
        //                 V626.57
        //                 a40.76,40.76,0,0,0,40.76,40.76
        //                 H702.91
        //                 a40.76,40.76,0,0,0,40.76,-40.76
        //                 V153.43
        //                 a40.76,40.76,0,0,0,-40.76,-40.76
        //                 H517.09
        //                 A40.76,40.76,0,0,0,476.33,153.43 Z
        //                 `
        // let framePath3 = `
        //                 M${startX + padding},${startY + padding + cornerRadius}
        //                 L${startX + padding},473.14
        //                 a40.76,40.76,0,0,0,40.76,40.76
        //                 H226.58
        //                 a40.76,40.76,0,0,0,40.76,-40.76
        //                 V${startY + padding + cornerRadius}
        //                 a40.76,40.76,0,0,0,-40.76,-40.76
        //                 H${startX + padding + cornerRadius}
        //                 A40.76,40.76,0,0,0,${startX + padding},${startY + padding + cornerRadius} Z
        //                 `
        //                 let framePath = `M${startX + padding},${startY + padding}
        //                                  L${width - padding},${startY + padding}
        //                                  L${width - padding},${height - padding}
        //                                  L${startX + padding},${height - padding} z`
        //
        // let frame = <path d={framePath} fill="none" stroke="black" strokeWidth="1"/>

        let width = 800
        let height = 600
        let padding = 2
        let viewBox = `0 0 ${width} ${height}`

        let startX = 0
        let startY = 0
        let phoneHeightFactor = 1.324
        let phoneHeightToWidthFactor = 2.2
        let phoneHeightToRadiusFactor = 12.67
        let phoneHeight = height / phoneHeightFactor // 453.14
        let phoneWidth = phoneHeight / phoneHeightToWidthFactor // 205.82
        let phoneRadius = phoneHeight / phoneHeightToRadiusFactor // 35.76
        let framePath = `M${startX + padding},${startY + padding + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${-phoneRadius}
                         H${phoneWidth}
                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${phoneRadius}
                         V${phoneHeight}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${phoneRadius}
                         H${startX + padding + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${-phoneRadius} z`

        let frame = <path d={framePath} fill="none" stroke="black" strokeWidth="1"/>

        startX = 0
        startY = 0
        let phoneBorder = 7

        // let contentFrameFactor = 0.99
        let contentHeight = phoneHeight - phoneBorder
        phoneWidth = contentHeight / phoneHeightToWidthFactor
        phoneRadius = contentHeight / phoneHeightToRadiusFactor

        let notchRadius = phoneRadius / 3
        let notchHeight = 10
        let notchWidth = phoneWidth / 2 + notchRadius 
        // let notchDist = (phoneWidth - 2 * phoneRadius - notchWidth) / 2
        let notchDist = 17
        console.log(notchDist);

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
                         V${contentHeight}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${phoneRadius}
                         H${startX + phoneBorder + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${-phoneRadius} z`


        let content = <path d={contentPath} fill="none" stroke="black" strokeWidth="1" fill='url(#dotsPattern)'/>

        return (
            <svg style={{width:'100%', height:'100%'}} viewBox={viewBox}>
                <DotsFillPattern/>
                <g >
                    {frame}
                    {content}
                </g>
            </svg>
        )
    }
}
