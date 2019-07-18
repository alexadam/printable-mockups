

import React from 'react'
import ReactDOM from 'react-dom';
import Modal from 'react-modal';

import {$,jQuery} from 'jquery'
// export for others scripts to use
window.$ = $
window.jQuery = jQuery
window.React = React;
window.ReactDOM = ReactDOM;

import  GoldenLayout from './golden-layout/js_es6/LayoutManager';
import './golden-layout/css/goldenlayout-base.css';
import './golden-layout/css/goldenlayout-dark-theme.css';

import {BrowserMockup, PhoneMockup, WatchMockup, PatternSelectorIcon} from './svg-utils'
import './mockup-editor.scss'


class PropertiesMenu extends React.Component {

    state = {
        patternType: this.props.currentPattern.patternType,
        patternDimensionInMM: parseInt(this.props.currentPattern.patternDimensionInMM)
    }

    onPatternDimChange = (e) => {
        let newVal = e.target.value
        this.setState({
            patternDimensionInMM: parseInt(newVal)
        })
    }

    onSave = () => {
        this.props.onSave({backgroundData: this.state})
    }

    render = () => {

        let patternTypes = ['dots', 'lines', 'squares']
        let patternElements = []

        let index = 0
        for (const pType of patternTypes) {
            let className = "mkp-prop-menu-list-item"
            if (this.state.patternType === pType) {
                className += ' mkp-selected-pattern'
            }
            patternElements.push(
                <div className={className} onClick={()=>this.setState({patternType: pType})} key={index++}>
                    <PatternSelectorIcon type={pType}  />
                </div>
            )
        }

        return (
            <div className="mkp-prop-menu-container">
                <div className="mkp-prop-menu-row">
                    <div className="mkp-prop-menu-title">
                        Set Background Pattern
                    </div>
                </div>
                <div className="mkp-prop-menu-row">
                    <div className="mkp-prop-menu-label">Dimension:</div>
                    <input className="mkp-prop-menu-input" type="number" name="quantity" min="1" max="999" value={this.state.patternDimensionInMM} onChange={this.onPatternDimChange}/>
                    <div className="mkp-prop-menu-label">mm</div>
                </div>
                <div className="mkp-prop-menu-row">
                    <div className="mkp-prop-menu-label">Type:</div>
                    {patternElements}
                </div>
                <div className="mkp-prop-menu-footer">
                    <button className="mkp-prop-menu-btn" onClick={this.props.onClose}>Cancel</button>
                    <button className="mkp-prop-menu-btn mkp-prop-menu-btn-save" onClick={this.onSave}>Save</button>
                </div>
            </div>
        )
    }
}


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
        isPropertiesMenuVisible: false,
        backgroundData: this.props.glContainer._config.props.backgroundData,
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

        this.props.glContainer.on('show', () => {
            this.props.glContainer.parent.parent.header.on('toggle_properties', () => {
                this.setState({
                    isPropertiesMenuVisible: !this.state.isPropertiesMenuVisible
                })
            })
        })
        if (this.props.glContainer.parent && this.props.glContainer.parent.parent) {
            this.props.glContainer.parent.parent.header.on('toggle_properties', () => {
                this.setState({
                    isPropertiesMenuVisible: !this.state.isPropertiesMenuVisible
                })
            })
        }

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

    onClosePropertiesModal = () => {
        this.setState({
            isPropertiesMenuVisible: false
        })
    }

    onNewProperties = (newProps) => {
        this.setState({
            isPropertiesMenuVisible: false,
            backgroundData: newProps.backgroundData
        }, () => {
            // update GoldenLayout state
            this.props.glContainer._config.props['backgroundData'] = JSON.parse(JSON.stringify(this.state.backgroundData))
            this.props.glContainer.extendState({
                backgroundData: JSON.parse(JSON.stringify(this.state.backgroundData))
            });
        })
    }

    render = () => {  

        let svgElem = null
        if (this.props.glContainer._config.props['type'] === 'watch-mockup') {
            svgElem = <WatchMockup parentWidth={this.state.svgWidth} 
                                   parentHeight={this.state.svgHeight} 
                                   pageData={this.state.pageData} 
                                   backgroundData={this.state.backgroundData}
                                   asIcon={false}/>
        } else if (this.props.glContainer._config.props['type'] === 'phone-mockup') {
            svgElem = <PhoneMockup parentWidth={this.state.svgWidth} 
                                   parentHeight={this.state.svgHeight} 
                                   pageData={this.state.pageData} 
                                   backgroundData={this.state.backgroundData}
                                   asIcon={false}/>
        } else if (this.props.glContainer._config.props['type'] === 'browser-mockup') {
            svgElem = <BrowserMockup parentWidth={this.state.svgWidth} 
                                     parentHeight={this.state.svgHeight} 
                                     pageData={this.state.pageData} 
                                     backgroundData={this.state.backgroundData}
                                     asIcon={false}/>
        }

        /**
         * 
         * <div style={{position:'absolute', width:'100px', height:'100px', top:this.state.svgHeight/2-50, left:this.state.svgWidth/2-50, backgroundColor:'black', color:'white'}}>
                    <div>Width:</div>
                    <div>Height:</div>
                </div>
         */

        const customStyles = {
            content : {
              top                   : '50%',
              left                  : '50%',
              right                 : 'auto',
              bottom                : 'auto',
              marginRight           : '-50%',
              transform             : 'translate(-50%, -50%)',
              width: '500px',
              height: '360px',
              zIndex: '9999'
            }
        };

        return (
            <div style={{width: '100%', height: '100%'}} ref={this.myRef}>
                <div className="svg-wrapper">
                    {svgElem}
                </div>
                <Modal
                    isOpen={this.state.isPropertiesMenuVisible}
                    onRequestClose={this.onClosePropertiesModal}
                    style={customStyles}
                    >
                    <PropertiesMenu currentPattern={this.state.backgroundData} onClose={this.onClosePropertiesModal} onSave={this.onNewProperties}/>
                </Modal>
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
                    props: {
                        type: 'browser-mockup',
                        backgroundData: {
                            patternType: 'dots',
                            patternDimensionInMM: 5
                        }
                    }
                },{
                    type: 'react-component',
                    component: 'PhoneMockupComponent',
                    props: {
                        type: 'phone-mockup',
                        backgroundData: {
                            patternType: 'dots',
                            patternDimensionInMM: 5
                        }
                    }
                },{
                    type: 'react-component',
                    component: 'WatchMockupComponent',
                    props: {
                        type: 'watch-mockup',
                        backgroundData: {
                            patternType: 'dots',
                            patternDimensionInMM: 5
                        }
                    }
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
                props: {
                    type: 'phone-mockup',
                    backgroundData: {
                        patternType: 'dots',
                        patternDimensionInMM: 5
                    }
                }
            } 
        );

        layout.createDragSource(document.getElementById('WatchMockupMenuItem'), 
            {
                type: 'react-component',
                component: 'WatchMockupComponent',
                props: {
                    type: 'watch-mockup',
                    backgroundData: {
                        patternType: 'dots',
                        patternDimensionInMM: 5
                    }
                }
            }
        );

        layout.createDragSource(document.getElementById('BrowserMockupMenuItem'), 
            {
                type: 'react-component',
                component: 'BrowserMockupComponent',
                props: {
                    type: 'browser-mockup',
                    backgroundData: {
                        patternType: 'dots',
                        patternDimensionInMM: 5
                    }
                }
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
