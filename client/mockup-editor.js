

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


var config = {
  content: [{
    type: 'row',
    content: [
       {
        title: 'A react component',
        type:'react-component',
        component: 'testItem',
        props: {value: 'I\'m on the left'}
       },
        {
        title: 'Another react component',
        type:'react-component',
        component: 'testItem'
       }
    ]
  }]
};


class MockupComponent extends React.Component {
    state = {
        svgWidth: '100%',
        svgHeight: '100%',
        value: parseInt(this.props.glContainer._config.props.value)
    }

    constructor(props) {
        super(props);
        this.myRef = React.createRef();
    }

    componentDidMount = () => {
        // this.props.glEventHub.on('event', () => {
        // })
        this.setNodeDimensions()
        this.props.glContainer.on('resize', () => {
            this.setNodeDimensions()
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
            svgElem = <WatchMockupWrapper bgColor="red" width={this.state.svgWidth} height={this.state.svgHeight} />
        } else if (this.props.glContainer._config.props['type'] === 'phone-mockup') {
            svgElem = <PhoneMockupWrapper bgColor="yellow" width={this.state.svgWidth} height={this.state.svgHeight} />
        } else if (this.props.glContainer._config.props['type'] === 'browser-mockup') {
            svgElem = <BrowserMockupWrapper bgColor="yellow" width={this.state.svgWidth} height={this.state.svgHeight} />
        }

        return (
            <div style={{width: '100%', height: '100%'}} ref={this.myRef}>
                {svgElem}
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
            component.container.on('resize', () => {
                // component.emit('event')
                // component.trigger('event')
                // component.container.emit('event')
                // component.instance._container.emit('event')
                // component.config.props['value'] = component.config.props['value']+100
            });
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
