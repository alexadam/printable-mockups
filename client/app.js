import React from 'react';
import ReactDOM from 'react-dom';
import './style.scss';

import {BrowserMockup, PhoneMockup, WatchMockup} from './svg-utils'
import * as PDFUtils from './svg-pdf'

import MyGoldenLayout from './glayout'

class App extends React.Component {

    constructor(props) {
        super(props);
        this.GoldenLayout = React.createRef();
    }

    getLayoutData = () => {
        let data = this.GoldenLayout.current.getLayoutData()
        let paperDim = this.GoldenLayout.current.getPaperDimensions()

        // TODO
        console.log('layout data', data, 'PD', paperDim);
    }

    prepareSVGData = () => {
        let container = document.getElementById('layoutContainer')
        let containerSize = container.getBoundingClientRect()

        let data = {
            paper: {
                orientation: 'landscape', // TODO
                widthPixels: containerSize.width,
                heightPixels: containerSize.height,
                containerOffsetX: containerSize.left,
                containerOffsetY: containerSize.top
            },
            forms: []
        }

        let svgElems = document.getElementsByClassName('mkp-svg')
        for (let svgElem of svgElems) {
            let type = svgElem.getAttribute('type')

            let size = null
            size = svgElem.getBoundingClientRect()

            // let children = svgElem.children;
            // for (let child of children) {
            //     if (child.tagName === 'g') {
            //         size = child.getBoundingClientRect()
            //         // TODO remove / test different heights
            //         // let tttt = svgElem.getBoundingClientRect()
            //     }
            // }

            let qualityFactor = 1
            
            let originalWidth = svgElem.style.width
            let originalHeight = svgElem.style.height
            svgElem.style.width = parseInt(svgElem.style.width) * qualityFactor + 'px'
            svgElem.style.height = parseInt(svgElem.style.height) * qualityFactor + 'px'

            let svgAsText = new XMLSerializer().serializeToString(svgElem);

            svgElem.style.height = originalHeight
            svgElem.style.width = originalWidth

            data.forms.push({
                type,
                size,
                svgAsText,
                options: {}
            })
        }

        return data
    }

    savePdf = () => {
        let data = this.prepareSVGData()
        PDFUtils.createTestPDF(data)
    }

    render = () => {


        // <div style={{width:'800px', height:'100%'}}>
        //     <BrowserMockup />
        //     <PhoneMockup parentWidth={460} parentHeight={1200} />
        //     <WatchMockup />
        // </div>

        return (
            <div className="app">
                <h1>Hello World</h1>
                <button onClick={this.savePdf}>save</button>
                <button onClick={this.getLayoutData}>Get Layout Data</button>
                <MyGoldenLayout ref={this.GoldenLayout} />
            </div>
        )
    }
}

ReactDOM.render((
    <App/>
), document.getElementById('app'));
