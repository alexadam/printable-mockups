

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

import {
    BrowserMockup, LaptopMockup, MonitorMockup, TVMockup, TabletMockup, PhoneMockup, AndroidMockup,
    WatchMockup, RoundWatchMockup, ModalMockup, StoryboardMockup, TitleBlockMockup,
    StickyNoteMockup, NotesMockup, FoldableMockup, CarMockup, KioskMockup, TerminalMockup,
    WidgetsMockup, VRMockup
} from './svg-utils.jsx'
import './mockup-editor.css'
import './properties-menu.css'

import * as Utils from './utils'
import PropertiesMenu from './properties-menu.jsx'


const dots = (dimensionInMM = 5) => ({patternType: 'dots', patternDimensionInMM: dimensionInMM})

/*
 * Every mockup, in the order they appear in the menu. This one list drives the
 * menu items, the GoldenLayout component registration and the drag sources, so
 * a new mockup is a geometry function, a wrapper in svg-utils and an entry here.
 * `group` is the menu section it lands in; the sections show up in the order
 * their first mockup does.
 */
const MOCKUPS = [
    {type: 'browser-mockup', title: 'Browser Mockup', Mockup: BrowserMockup, group: 'Desktop',
     properties: {backgroundData: dots()}},
    {type: 'terminal-mockup', title: 'Terminal Window', Mockup: TerminalMockup, group: 'Desktop',
     properties: {backgroundData: {patternType: 'lines', patternDimensionInMM: 6}}},
    {type: 'laptop-mockup', title: 'Laptop Mockup', Mockup: LaptopMockup, group: 'Desktop',
     properties: {backgroundData: dots()}},
    {type: 'monitor-mockup', title: 'Monitor Mockup', Mockup: MonitorMockup, group: 'Desktop',
     properties: {backgroundData: dots()}},
    {type: 'tablet-mockup', title: 'Tablet Mockup', Mockup: TabletMockup, group: 'Mobile',
     properties: {backgroundData: dots()}},
    {type: 'phone-mockup', title: 'Phone Mockup (notch)', Mockup: PhoneMockup, group: 'Mobile',
     properties: {backgroundData: dots()}},
    {type: 'android-mockup', title: 'Phone Mockup (punch-hole)', Mockup: AndroidMockup, group: 'Mobile',
     properties: {backgroundData: dots(), navBar: {isNavBarVisible: true}}},
    {type: 'foldable-mockup', title: 'Foldable Phone (open)', Mockup: FoldableMockup, group: 'Mobile',
     properties: {backgroundData: dots()}},
    {type: 'watch-mockup', title: 'Watch Mockup (square)', Mockup: WatchMockup, group: 'Wearable & XR',
     properties: {backgroundData: dots()}},
    {type: 'round-watch-mockup', title: 'Watch Mockup (round)', Mockup: RoundWatchMockup, group: 'Wearable & XR',
     properties: {backgroundData: dots()}},
    {type: 'vr-mockup', title: 'VR / AR Field of View', Mockup: VRMockup, group: 'Wearable & XR',
     properties: {backgroundData: dots()}},
    {type: 'tv-mockup', title: 'TV / 16:9 Frame', Mockup: TVMockup, group: 'Large Screens',
     properties: {backgroundData: dots(), stand: {isStandVisible: true}}},
    {type: 'car-mockup', title: 'Car Infotainment', Mockup: CarMockup, group: 'Large Screens',
     properties: {backgroundData: dots(), controls: {areControlsVisible: true}}},
    {type: 'kiosk-mockup', title: 'Kiosk / POS Terminal', Mockup: KioskMockup, group: 'Large Screens',
     properties: {backgroundData: dots(), stand: {isStandVisible: true}}},
    {type: 'modal-mockup', title: 'Modal / Dialog Card', Mockup: ModalMockup, group: 'UI & Layout',
     properties: {backgroundData: dots()}},
    {type: 'widgets-mockup', title: 'Widget Squares', Mockup: WidgetsMockup, group: 'UI & Layout',
     properties: {backgroundData: dots(), widgets: {layout: 'mixed'}}},
    {type: 'storyboard-mockup', title: 'Storyboard Sheet', Mockup: StoryboardMockup, group: 'UI & Layout',
     properties: {backgroundData: dots(), storyboard: {columns: 3, rows: 2, frame: 'phone'}}},
    {type: 'title-block-mockup', title: 'Title Block', Mockup: TitleBlockMockup, group: 'Paper & Notes',
     properties: {}},
    {type: 'sticky-note-mockup', title: 'Sticky Note / Index Card', Mockup: StickyNoteMockup, group: 'Paper & Notes',
     properties: {backgroundData: {patternType: 'lines', patternDimensionInMM: 6},
                  fold: {isFoldVisible: true}}},
    {type: 'notes-mockup', title: 'Notes Mockup', Mockup: NotesMockup, group: 'Paper & Notes',
     properties: {border: {isBorderVisible: true}, backgroundData: {patternType: 'lines', patternDimensionInMM: 7}}}
]

const MOCKUP_BY_TYPE = {}
for (let mockup of MOCKUPS) {
    MOCKUP_BY_TYPE[mockup.type] = mockup
}

// [{name, mockups}], sections in the order their first mockup appears above
const MOCKUP_GROUPS = []
for (let mockup of MOCKUPS) {
    let group = MOCKUP_GROUPS.find((g) => g.name === mockup.group)
    if (!group) {
        group = {name: mockup.group, mockups: []}
        MOCKUP_GROUPS.push(group)
    }
    group.mockups.push(mockup)
}

// px box the icon SVG is fitted into - keep in sync with .mkp-editor-src-menu-item in mockup-editor.css
const MENU_ICON_SIZE = 58

// The mockup type doubles as the GoldenLayout component name and the menu item id
const menuItemID = (type) => type + '-menu-item'

const itemConfig = (type) => ({
    type: 'react-component',
    component: type,
    // without this GoldenLayout labels the tab with the component name
    title: MOCKUP_BY_TYPE[type].title,
    props: {
        type,
        // a deep copy, so panes never end up sharing one properties object
        properties: JSON.parse(JSON.stringify(MOCKUP_BY_TYPE[type].properties))
    }
})


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
        let mockup = MOCKUP_BY_TYPE[componentType]

        if (mockup) {
            let Mockup = mockup.Mockup
            svgElem = <Mockup parentWidth={this.state.svgWidth}
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

// The draggable icon in the side menu. GoldenLayout binds the drag to its id.
const MockupMenuItem = ({mockup}) => {
    let Mockup = mockup.Mockup
    return (
        <div id={menuItemID(mockup.type)} className="mkp-editor-src-menu-item" title={mockup.title}>
            <div className="svg-wrapper">
                <Mockup parentWidth={MENU_ICON_SIZE} parentHeight={MENU_ICON_SIZE} asIcon={true}/>
            </div>
        </div>
    )
}

/*
 * One collapsible section of the side menu. Collapsing only hides the items in
 * CSS - they have to stay in the DOM, because GoldenLayout bound a drag source
 * to each of them once, by id, at startup.
 */
const MockupMenuGroup = ({group, isCollapsed, onToggle}) => (
    <div className={'mkp-editor-menu-group' + (isCollapsed ? ' mkp-editor-menu-group-collapsed' : '')}>
        <div className="mkp-editor-menu-group-header"
             onClick={onToggle}
             role="button"
             tabIndex={0}
             onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onToggle()}
             title={(isCollapsed ? 'Show ' : 'Hide ') + group.name}>
            <span className="mkp-editor-menu-group-arrow">&#9662;</span>
            <span className="mkp-editor-menu-group-name">{group.name}</span>
            <span className="mkp-editor-menu-group-count">{group.mockups.length}</span>
        </div>
        <div className="mkp-editor-menu-group-items">
            {group.mockups.map((mockup) => <MockupMenuItem mockup={mockup} key={mockup.type}/>)}
        </div>
    </div>
)

export default class MyGoldenLayout extends React.PureComponent {

    state = {
        // names of the menu sections the user has collapsed
        collapsedGroups: [],
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
                content: [
                    itemConfig('phone-mockup'),
                    itemConfig('android-mockup'),
                    {
                        type: 'column',
                        content: [
                            itemConfig('watch-mockup'),
                            itemConfig('watch-mockup')
                        ]
                    }
                ]
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
        //wrapComponent('phone-mockup', 'this.context.store')
        for (let mockup of MOCKUPS) {
            layout.registerComponent(mockup.type, wrapComponent());
        }

        layout.init();

        // the menu items are already in the DOM: render() runs before this
        for (let mockup of MOCKUPS) {
            layout.createDragSource(document.getElementById(menuItemID(mockup.type)), itemConfig(mockup.type));
        }

        layout.on('stateChanged', () => {
            // var state = JSON.stringify( myLayout.toConfig() );
            // myLayout = new GoldenLayout( JSON.parse( state ) );
            // myLayout.init()
        })

        layout.on('componentCreated', () => {
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

    toggleGroup = (groupName) => {
        this.setState((prevState) => ({
            collapsedGroups: prevState.collapsedGroups.includes(groupName)
                ? prevState.collapsedGroups.filter((name) => name !== groupName)
                : [...prevState.collapsedGroups, groupName]
        }))
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
                    {MOCKUP_GROUPS.map((group) => (
                        <MockupMenuGroup group={group}
                                         key={group.name}
                                         isCollapsed={this.state.collapsedGroups.includes(group.name)}
                                         onToggle={() => this.toggleGroup(group.name)}/>
                    ))}
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
