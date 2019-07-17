

import React from 'react'
import ReactDOM from 'react-dom';

import {$,jQuery} from 'jquery'
// export for others scripts to use
window.$ = $
window.jQuery = jQuery
window.React = React;
window.ReactDOM = ReactDOM;

import  GoldenLayout from './golden-layout/js_es6/LayoutManager';
import './golden-layout/css/goldenlayout-base.css';
import './golden-layout/css/goldenlayout-dark-theme.css';

import {BrowserMockup, PhoneMockup, WatchMockup} from './svg-utils'
import './mockup-editor.scss'


class MockupComponent extends React.Component {
    state = {
        svgWidth: '100%',
        svgHeight: '100%',
        value: parseInt(this.props.glContainer._config.props.value),
        pageData: {
            orientation: 'landscape',
            width: 1000,
            height: 707
        },
        testValue: parseInt(this.props.glContainer._config.props.testValue)
    }

    constructor(props) {
        super(props);
        this.myRef = React.createRef();
    }

    componentDidMount = () => {
        // this.props.glEventHub.on('event', () => {
        // })
        this.setNodeDimensions()
        this.setPageOrientation()
        this.props.glContainer.on('resize', () => {
            this.setNodeDimensions()
        })
        this.props.glEventHub.on('pageOrientationChanged', (data) => {
            this.setPageOrientation(data)
        })
    }

    setNodeDimensions = () => {
        let node = this.myRef.current;
        let parentNode = node.parentNode
        let parentNodeBBox = parentNode.getBoundingClientRect()

        this.setState({
            svgWidth: parentNodeBBox.width,
            svgHeight: parentNodeBBox.height
        })

        /////
        /////
        /////
        /////
        this.props.glContainer._config.props['testValue'] = this.state.testValue + 1
        this.props.glContainer.extendState({
            testValue: this.state.testValue + 1
        });
    }

    setPageOrientation = (data = {newOrientation: 'landscape'}) => {
        if (data.newOrientation === 'landscape') {
            this.setState({
                pageData: {
                    orientation: 'landscape',
                    width: 1000,
                    height: 707
                }
            })
        } else {
            this.setState({
                pageData: {
                    orientation: 'portrait',
                    width: 707,
                    height: 1000
                }
            })
        }
    }

    componentWillUnmount() {
     //    glEventHub.off('YourComponentProps', this.setState, this)
     //    this.props.glContainer.off('resize', () => {
     //    })
     }

    onClick = () => {
        // console.log(this.props.glContainer);
        // console.log(this.props.glEventHub);
        this.props.glContainer._config.props['value'] = this.state.value+1
        this.props.glContainer.extendState({
                value: this.state.value+1
        });
        this.setState({value: this.state.value+1})
    }

    render = () => {        

        let svgElem = null
        if (this.props.glContainer._config.props['type'] === 'watch-mockup') {
            svgElem = <WatchMockup parentWidth={this.state.svgWidth} 
                                   parentHeight={this.state.svgHeight} 
                                   pageData={this.state.pageData} 
                                   asIcon={false}/>
        } else if (this.props.glContainer._config.props['type'] === 'phone-mockup') {
            svgElem = <PhoneMockup parentWidth={this.state.svgWidth} 
                                   parentHeight={this.state.svgHeight} 
                                   pageData={this.state.pageData} 
                                   asIcon={false}/>
        } else if (this.props.glContainer._config.props['type'] === 'browser-mockup') {
            svgElem = <BrowserMockup parentWidth={this.state.svgWidth} 
                                     parentHeight={this.state.svgHeight} 
                                     pageData={this.state.pageData} 
                                     asIcon={false}/>
        }

        return (
            <div style={{width: '100%', height: '100%'}} ref={this.myRef}>
                <div className="svg-wrapper">
                    {svgElem}
                </div>
            </div>
        )
    }
}

const WatchMockupWrapper = (props) => (
    <div className="svg-wrapper">
        <WatchMockup parentWidth={props.width} parentHeight={props.height} asIcon={props.asIcon}/>
    </div>
)

const PhoneMockupWrapper = (props) => (
    <div className="svg-wrapper">
        <PhoneMockup parentWidth={props.width} parentHeight={props.height} asIcon={props.asIcon} />
    </div>
)

const BrowserMockupWrapper = (props) => (
    <div className="svg-wrapper">
        <BrowserMockup parentWidth={props.width} parentHeight={props.height} asIcon={props.asIcon} />
    </div>
)

const PhoneMockupMenuItem = (props) => (
    <div id="PhoneMockupMenuItem" className="mkp-editor-src-menu-item">
        <PhoneMockupWrapper height={90} width={90} asIcon={true} />
    </div>
)

const WatchMockupMenuItem = (props) => (
    <div id="WatchMockupMenuItem" className="mkp-editor-src-menu-item">
        <WatchMockupWrapper height={90} width={90} asIcon={true} />
    </div>
)

const BrowserMockupMenuItem = (props) => (
    <div id="BrowserMockupMenuItem" className="mkp-editor-src-menu-item">
        <BrowserMockupWrapper height={90} width={90} asIcon={true} />
    </div>
)

class Wrapped22 extends React.Component {
    render() {
        // for Redux
        // return (
        //     <Provider store={store}>
        //         <Component {...this.props}/>
        //     </Provider>
        // );
        return (
            <MockupComponent {...this.props}/>
        );
    }
}

export default class MyGoldenLayout extends React.PureComponent {

  componentDidMount() {
        // Build basic golden-layout config
        const config = {
            settings: {
                hasHeaders: true,
                constrainDragToContainer: true,
                reorderEnabled: true,
                selectionEnabled: true,
                popoutWholeStack: false,
                blockedPopoutsThrowError: true,
                closePopoutsOnUnload: true,
                showPopoutIcon: false,
                showMaximiseIcon: false,
                showCloseIcon: false
            },
            dimensions: {
                borderWidth: 1,
                minItemHeight: 100,
                minItemWidth: 100,
                headerHeight: 20,
                dragProxyWidth: 300,
                dragProxyHeight: 200
            },
            content: [{
                type: 'row',
                content: [{
                    type: 'react-component',
                    component: 'BrowserMockupComponent',
                    props: {type: 'browser-mockup'}
                },{
                    type: 'react-component',
                    component: 'PhoneMockupComponent',
                    props: {type: 'phone-mockup'}
                },{
                    type: 'react-component',
                    component: 'WatchMockupComponent',
                    props: {type: 'watch-mockup'}
                }]
            }]
        };

        // func def for Redux
        // function wrapComponent(Component, store) {
        function wrapComponent() {
            class Wrapped extends React.Component {
                render() {
                    // for Redux
                    // return (
                    //     <Provider store={store}>
                    //         <Component {...this.props}/>
                    //     </Provider>
                    // );
                    return (
                        <MockupComponent {...this.props}/>
                    );
                }
            }
            return Wrapped;
        };

        var layout = new GoldenLayout(config, this.layout);

        // Redux example
        //wrapComponent('PhoneMockupComponent', 'this.context.store')
        layout.registerComponent('PhoneMockupComponent', wrapComponent());
        layout.registerComponent('WatchMockupComponent', wrapComponent());
        layout.registerComponent('BrowserMockupComponent', wrapComponent());

        layout.init();



        layout.createDragSource(document.getElementById('PhoneMockupMenuItem'), 
            {
                type: 'react-component',
                component: 'PhoneMockupComponent',
                props: {type: 'phone-mockup'}
            } 
        );

        layout.createDragSource(document.getElementById('WatchMockupMenuItem'), 
            {
                type: 'react-component',
                component: 'WatchMockupComponent',
                props: {type: 'watch-mockup'}
            }
        );

        layout.createDragSource(document.getElementById('BrowserMockupMenuItem'), 
            {
                type: 'react-component',
                component: 'BrowserMockupComponent',
                props: {type: 'browser-mockup'}
            }
        );



        layout.on('stateChanged', (e) => {
            // var state = JSON.stringify( myLayout.toConfig() );
            // myLayout = new GoldenLayout( JSON.parse( state ) );
            // myLayout.init()
        })

        layout.on('componentCreated', (component) => {
            // component.container.on('resize', () => {
                // component.emit('event')
                // component.trigger('event')
                // component.container.emit('event')
                // component.instance._container.emit('event')
                // component.config.props['value'] = component.config.props['value']+100
            // });
        });


        window.addEventListener('resize', () => {
            layout.updateSize();
        });


        this.layout = layout
    }

    paperSizeChange = (newOrientation) => {
        if (newOrientation === 'portrait') {
            layoutContainer.style.width = '707px'
            layoutContainer.style.height = '1000px'
            this.layout.updateSize(707, 1000)
        } else {
            layoutContainer.style.width = '1000px'
            layoutContainer.style.height = '707px'
            this.layout.updateSize(1000, 707)
        }

        this.layout.eventHub.emit('pageOrientationChanged', {newOrientation: newOrientation})
    }

    getLayoutData = () => {
        return this.layout.toConfig()
    }

    getPaperDimensions = () => {
        let elem = document.getElementById('layoutContainer')
        return elem.getBoundingClientRect()
    }

    render() {
        return (
            <div className="mkp-editor-container">
                <div className="mkp-editor-menu-container" >
                    <BrowserMockupMenuItem />
                    <PhoneMockupMenuItem />
                    <WatchMockupMenuItem />
                </div>
                <div className="mkp-layout-gl-container">
                    <div id='layoutContainer' className='goldenLayout paper' ref={input => this.layout = input} />
                </div>
            </div>
        );
    }
}
