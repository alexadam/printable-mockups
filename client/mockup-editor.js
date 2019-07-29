

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

import {BrowserMockup, TabletMockup, PhoneMockup, WatchMockup, NotesMockup} from './svg-utils'
import './mockup-editor.scss'
import './properties-menu.scss'

import * as Utils from './utils'
import PropertiesMenu from './properties-menu'




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
        properties: this.props.glContainer._config.props.properties,
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
            properties: newProps
        }, () => {
            // update GoldenLayout state
            let tmpProps = JSON.parse(JSON.stringify(this.state.properties))
            this.props.glContainer._config.props['properties'] = tmpProps
            this.props.glContainer.extendState({
                properties: tmpProps
            })
        })
    }

    render = () => {  

        let svgElem = null
        let componentType = this.props.glContainer._config.props['type']

        if (componentType === 'watch-mockup') {
            svgElem = <WatchMockup parentWidth={this.state.svgWidth} 
                                   parentHeight={this.state.svgHeight} 
                                   pageData={this.state.pageData} 
                                   properties={this.state.properties}
                                   asIcon={false}/>
        } else if (componentType === 'phone-mockup') {
            svgElem = <PhoneMockup parentWidth={this.state.svgWidth} 
                                   parentHeight={this.state.svgHeight} 
                                   pageData={this.state.pageData} 
                                   properties={this.state.properties}
                                   asIcon={false}/>
        } else if (componentType === 'browser-mockup') {
            svgElem = <BrowserMockup parentWidth={this.state.svgWidth} 
                                     parentHeight={this.state.svgHeight} 
                                     pageData={this.state.pageData} 
                                     properties={this.state.properties}
                                     asIcon={false}/>
        } else if (componentType === 'tablet-mockup') {
            svgElem = <TabletMockup parentWidth={this.state.svgWidth} 
                                     parentHeight={this.state.svgHeight} 
                                     pageData={this.state.pageData} 
                                     properties={this.state.properties}
                                     asIcon={false}/>
        } else if (componentType === 'notes-mockup') {
            svgElem = <NotesMockup parentWidth={this.state.svgWidth} 
                                     parentHeight={this.state.svgHeight} 
                                     pageData={this.state.pageData} 
                                     properties={this.state.properties}
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
              height: 'auto',
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
                    style={customStyles}>
                    <PropertiesMenu properties={this.state.properties}
                                    componentType={componentType}
                                    onClose={this.onClosePropertiesModal} 
                                    onSave={this.onNewProperties}/>
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

const TabletMockupWrapper = (props) => (
    <div className="svg-wrapper">
        <TabletMockup parentWidth={props.width} parentHeight={props.height} asIcon={props.asIcon} />
    </div>
)

const NotesMockupWrapper = (props) => (
    <div className="svg-wrapper">
        <NotesMockup parentWidth={props.width} parentHeight={props.height} asIcon={props.asIcon} />
    </div>
)


const PhoneMockupMenuItem = (props) => (
    <div id="PhoneMockupMenuItem" className="mkp-editor-src-menu-item" title="Phone Mockup">
        <PhoneMockupWrapper height={90} width={90} asIcon={true} />
    </div>
)

const WatchMockupMenuItem = (props) => (
    <div id="WatchMockupMenuItem" className="mkp-editor-src-menu-item" title="Watch Mockup">
        <WatchMockupWrapper height={90} width={90} asIcon={true} />
    </div>
)

const BrowserMockupMenuItem = (props) => (
    <div id="BrowserMockupMenuItem" className="mkp-editor-src-menu-item" title="Browser Mockup">
        <BrowserMockupWrapper height={90} width={90} asIcon={true} />
    </div>
)

const TabletMockupMenuItem = (props) => (
    <div id="TabletMockupMenuItem" className="mkp-editor-src-menu-item" title="Tablet Mockup">
        <TabletMockupWrapper height={90} width={90} asIcon={true} />
    </div>
)

const NotesMockupMenuItem = (props) => (
    <div id="NotesMockupMenuItem" className="mkp-editor-src-menu-item" title="Notes Mockup">
        <NotesMockupWrapper height={90} width={90} asIcon={true} />
    </div>
)

export default class MyGoldenLayout extends React.PureComponent {

    state = {
        pageWidth: 1000,
        pageHeight: 707,
        pageOrientation: 'landscape',
        pagePaddingMM: {
            top: 5,
            right: 5,
            bottom: 5,
            left: 5,
        },
        pagePaddingPixels: {
            top: Utils.mmToPixels(5),
            right: Utils.mmToPixels(5),
            bottom: Utils.mmToPixels(5),
            left: Utils.mmToPixels(5),
        }
    }

    componentDidMount() {
        
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
                    component: 'PhoneMockupComponent',
                    props: {
                        type: 'phone-mockup',
                        properties: {
                            backgroundData: {
                                patternType: 'dots',
                                patternDimensionInMM: 5
                            }
                        }
                    }
                },{
                    type: 'react-component',
                    component: 'PhoneMockupComponent',
                    props: {
                        type: 'phone-mockup',
                        properties: {
                            backgroundData: {
                                patternType: 'dots',
                                patternDimensionInMM: 5
                            }
                        }
                    }
                },{
                    type: 'column',
                    content: [{
                        type: 'react-component',
                        component: 'WatchMockupComponent',
                        props: {
                            type: 'watch-mockup',
                            properties: {
                                backgroundData: {
                                    patternType: 'dots',
                                    patternDimensionInMM: 5
                                }
                            }
                        }
                    },{
                        type: 'react-component',
                        component: 'WatchMockupComponent',
                        props: {
                            type: 'watch-mockup',
                            properties: {
                                backgroundData: {
                                    patternType: 'dots',
                                    patternDimensionInMM: 5
                                }
                            }
                        }
                    }]
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

        // this.layout = React.createRef()        
        let layout = new GoldenLayout(config, document.getElementById('layoutContainer'));

        // Redux example
        //wrapComponent('PhoneMockupComponent', 'this.context.store')
        layout.registerComponent('PhoneMockupComponent', wrapComponent());
        layout.registerComponent('WatchMockupComponent', wrapComponent());
        layout.registerComponent('BrowserMockupComponent', wrapComponent());
        layout.registerComponent('TabletMockupComponent', wrapComponent());
        layout.registerComponent('NotesMockupComponent', wrapComponent());

        layout.init();



        layout.createDragSource(document.getElementById('PhoneMockupMenuItem'), 
            {
                type: 'react-component',
                component: 'PhoneMockupComponent',
                props: {
                    type: 'phone-mockup',
                    properties: {
                        backgroundData: {
                            patternType: 'dots',
                            patternDimensionInMM: 5
                        }
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
                    properties: {
                        backgroundData: {
                            patternType: 'dots',
                            patternDimensionInMM: 5
                        }
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
                    properties: {
                        backgroundData: {
                            patternType: 'dots',
                            patternDimensionInMM: 5
                        }
                    }
                }
            }
        );

        layout.createDragSource(document.getElementById('TabletMockupMenuItem'), 
            {
                type: 'react-component',
                component: 'TabletMockupComponent',
                props: {
                    type: 'tablet-mockup',
                    properties: {
                        backgroundData: {
                            patternType: 'dots',
                            patternDimensionInMM: 5
                        }
                    }
                }
            }
        );

        layout.createDragSource(document.getElementById('NotesMockupMenuItem'), 
            {
                type: 'react-component',
                component: 'NotesMockupComponent',
                props: {
                    type: 'notes-mockup',
                    properties: {
                        border: {
                            isBorderVisible: true
                        },
                        backgroundData: {
                            patternType: 'lines',
                            patternDimensionInMM: 7
                        }
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

    setPageMarginsInMM = (newValue) => {
        this.setState({
            pagePaddingMM: {
                top: newValue.top,
                right: newValue.right,
                bottom: newValue.bottom,
                left: newValue.left,
            },
            pagePaddingPixels: {
                top: Utils.mmToPixels(newValue.top),
                right: Utils.mmToPixels(newValue.right),
                bottom: Utils.mmToPixels(newValue.bottom),
                left: Utils.mmToPixels(newValue.left),
            },
        }, () => this.layout.updateSize())
    }

    paperSizeChange = (newOrientation) => {        
        if (newOrientation === 'portrait') {
            this.setState({
                pageWidth: 707,
                pageHeight: 1000,
                pageOrientation: 'portrait'
            }, () => {
                // TODO fix: updateSize(707, 1000) vs updateSize()
                // this.layout.updateSize(707, 1000)
                this.layout.updateSize()
                this.layout.eventHub.emit('pageOrientationChanged', {newOrientation: newOrientation})
            })
        } else {
            this.setState({
                pageWidth: 1000,
                pageHeight: 707,
                pageOrientation: 'landscape'
            }, () => {
                // TODO - see above
                // this.layout.updateSize(1000, 707)
                this.layout.updateSize()
                this.layout.eventHub.emit('pageOrientationChanged', {newOrientation: newOrientation})
            })
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

        // ref={input => this.layout = input}        

        return (
            <div className="mkp-editor-container">
                <div className="mkp-editor-menu-container" >
                    <BrowserMockupMenuItem />
                    <TabletMockupMenuItem />
                    <PhoneMockupMenuItem />
                    <WatchMockupMenuItem />
                    <NotesMockupMenuItem />
                </div>
                <div className="mkp-layout-gl-container">
                    <div id='layoutContainer' 
                        className='goldenLayout paper' 
                        style={{
                            paddingTop: this.state.pagePaddingPixels.top + 'px',
                            paddingRight: this.state.pagePaddingPixels.right + 'px',
                            paddingBottom: this.state.pagePaddingPixels.bottom + 'px',
                            paddingLeft: this.state.pagePaddingPixels.left + 'px',
                            width: this.state.pageWidth + 'px',
                            height: this.state.pageHeight + 'px',
                        }}
                    />
                </div>
            </div>
        );
    }
}
