import React from 'react';
import ReactDOM from 'react-dom';
import './style.scss';

import {BrowserMockup, PhoneMockup, WatchMockup} from './svg-utils'
import * as PDFUtils from './svg-pdf'

import MyGoldenLayout from './glayout'

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
                <div style={{width:'800px', height:'100%'}}>
                    <BrowserMockup />
                    <PhoneMockup />
                    <WatchMockup />
                </div>
                <MyGoldenLayout />
            </div>
        )
    }
}

ReactDOM.render((
    <App/>
), document.getElementById('app'));
