import React from 'react';
import ReactDOM from 'react-dom';
import './style.scss';

import {BrowserMockup, PhoneMockup, WatchMockup} from './svg-utils'
// {SVGUtils.createBrowserMockup()}

class App extends React.Component {

    render = () => {


        return (
            <div className="app">
                <h1>Hello World</h1>
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
