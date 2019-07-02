import React from 'react';
import ReactDOM from 'react-dom';
import './style.scss';

import {BrowserMockup, PhoneMockup, WatchMockup} from './svg-utils'
import * as PDFUtils from './svg-pdf'
// {SVGUtils.createBrowserMockup()}

class App extends React.Component {


    savePdf = () => {
        let elem = document.getElementsByClassName('mkp-svg-phone')[0]
        let svgAsText = new XMLSerializer().serializeToString(elem);

        let children = elem.children;
        for (let child of children) {
            if (child.tagName === 'g') {
                let dimensions = child.getBoundingClientRect();
            }
        }

        PDFUtils.createTestPDF(svgAsText)
    }

    render = () => {


        return (
            <div className="app">
                <h1>Hello World</h1>
                <button onClick={this.savePdf}>save</button>
                <div style={{width:'800px', height:'600px'}}>
                    <BrowserMockup />
                    <PhoneMockup />
                    <WatchMockup />
                </div>
            </div>
        )
    }
}

ReactDOM.render((
    <App/>
), document.getElementById('app'));
