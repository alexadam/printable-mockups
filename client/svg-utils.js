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
                         V${phoneHeight + startY}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${phoneRadius}
                         H${startX + padding + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${-phoneRadius} z`

        let frame = <path d={framePath} fill="none" stroke="black" strokeWidth="1"/>

        startX = 0
        startY = 0
        let phoneBorder = 7

        // let contentFrameFactor = 0.99
        let contentHeight = phoneHeight - phoneBorder + 2
        phoneWidth = contentHeight / phoneHeightToWidthFactor
        phoneRadius = contentHeight / phoneHeightToRadiusFactor

        let notchRadius = phoneRadius / 3
        let notchHeight = 10
        let notchWidth = phoneWidth / 2 //+ notchRadius
        console.log(notchWidth, notchRadius, phoneWidth);
        // let notchDist = (phoneWidth - 2 * phoneRadius - notchWidth) / 2
        let notchDist = phoneWidth / 9
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


export class WatchMockup extends React.Component {

    render = () => {
        let width = 800
        let height = 600
        let padding = 2
        let viewBox = `0 0 ${width} ${height}`

        let startX = 0
        let startY = 100
        let phoneHeightFactor = 2 //1.324
        let phoneHeightToWidthFactor = 1.25
        let phoneHeightToRadiusFactor = 12.67
        let phoneHeight = height / phoneHeightFactor // 453.14
        let phoneWidth = phoneHeight / phoneHeightToWidthFactor // 205.82
        let phoneRadius = phoneHeight / phoneHeightToRadiusFactor // 35.76
        let framePath = `M${startX + padding},${startY + padding + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${-phoneRadius}
                         H${phoneWidth}
                         a${phoneRadius},${phoneRadius},0,0,1,${phoneRadius},${phoneRadius}
                         V${phoneHeight + startY}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${phoneRadius}
                         H${startX + padding + phoneRadius}
                         a${phoneRadius},${phoneRadius},0,0,1,${-phoneRadius},${-phoneRadius} z
                        `
        console.log(phoneHeight, phoneWidth, 'ioiooi');

        let frame = <path d={framePath} fill="none" stroke="black" strokeWidth="1"/>



        startX = 20
        startY = 100
        let bigRadius = phoneRadius * 14
        let beltHeight = 40
        let beltLength = phoneWidth / 1.6
        let beltPath = `M${startX + padding},${startY}
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


        let content = <path d={contentPath} fill="none" stroke="black" strokeWidth="1" fill='url(#dotsPattern)'/>

        // {content}
        return (
            <svg style={{width:'100%', height:'100%'}} viewBox={viewBox}>
                <DotsFillPattern/>
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
