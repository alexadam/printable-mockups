import React from 'react'

const generatePatternID = (rootName) => rootName + '_' + Math.floor(Math.random() * 1000000)

// A fixed-size preview of a pattern, drawn at whatever size looks good in the
// menu - unlike the mockups, nothing here is meant to end up on paper.
class PatternSelectorIcon extends React.Component {

    render = () => {
        let patternId = generatePatternID('example')
        let pattern = null
        let patternDim = 15

        if (this.props.type === 'dots') {
            pattern = (
                <pattern id={patternId} patternUnits="userSpaceOnUse" width={patternDim} height={patternDim} x={0} y={0}>
                    <circle cx={patternDim/2} cy={patternDim/2} r={1} fill="black"/>
                </pattern>
            )
        } else if (this.props.type === 'lines') {
            pattern = (
                <pattern id={patternId} patternUnits="userSpaceOnUse" width={patternDim} height={patternDim} x={0} y={0}>
                    <line x1={0} y1={patternDim} x2={patternDim} y2={patternDim} stroke="black" strokeWidth={1} />
                </pattern>
            )
        } else if (this.props.type === 'squares') {
            pattern = (
                <pattern id={patternId} patternUnits="userSpaceOnUse" width={patternDim} height={patternDim} x={0} y={0}>
                    <line x1={0} y1={patternDim} x2={patternDim} y2={patternDim} stroke="black" strokeWidth={1} />
                    <line x1={patternDim} y1={0} x2={patternDim} y2={patternDim} stroke="black" strokeWidth={1} />
                </pattern>
            )
        }

        let dim = 75
        return (
            <svg
                 type="mkp-svg-pattern-example"
                 style={{width: dim +'px', height: dim + 'px'}}
                 viewBox={"0 0 " + dim + " " + dim}
                 preserveAspectRatio="xMidYMid meet">
                 {pattern}
                <g>
                    <rect x="0" y={0} width={dim} height={dim} stroke="black" strokeWidth={1} fill={`url(#${patternId})`}/>
                </g>
            </svg>
        )
    }
}

const parseBoolean = (val) => {
    if (typeof val === "boolean") {
        return val
    } 
    return val === "true"
}

/*
 * The on/off options, keyed by the property group they are stored under. The
 * fallback is what the geometry assumes when nothing has been stored yet, so
 * the checkbox and the drawing agree the first time the menu is opened.
 */
const TOGGLES = {
    border: {key: 'isBorderVisible', label: 'Display border:', fallback: false},
    navBar: {key: 'isNavBarVisible', label: 'Display navigation bar:', fallback: true},
    stand: {key: 'isStandVisible', label: 'Display stand:', fallback: true},
    fold: {key: 'isFoldVisible', label: 'Folded corner:', fallback: true},
    controls: {key: 'areControlsVisible', label: 'Display controls:', fallback: true}
}

const toggleValue = (properties, group, toggle) => {
    let value = (properties[group] || {})[toggle.key]
    return value === undefined || value === null ? toggle.fallback : parseBoolean(value)
}

class TogglePropertyMenu extends React.Component {

    state = {
        isOn: toggleValue(this.props.properties, this.props.group, TOGGLES[this.props.group])
    }

    onChange = () => {
        this.setState({
            isOn: !this.state.isOn
        }, () => {
            this.props.onNewProperties(
                this.props.group,
                {
                    [TOGGLES[this.props.group].key]: this.state.isOn
                })
        })
    }

    render = () => {

        let toggle = TOGGLES[this.props.group]

        return (
            <div className="mkp-prop-menu-component">
                <div className="mkp-prop-menu-row">
                    <div className="mkp-prop-menu-label">{toggle.label}</div>
                    <input className="mkp-prop-menu-checkbox" type="checkbox" name={toggle.key}
                            checked={this.state.isOn} onChange={this.onChange}/>
                </div>
            </div>
        )
    }

}

const MAX_STORYBOARD_CELLS = 6

const clampCells = (value, fallback = 1) => {
    let count = parseInt(value)
    if (isNaN(count)) {
        return fallback
    }
    return Math.min(MAX_STORYBOARD_CELLS, Math.max(1, count))
}

class StoryboardPropertiesMenu extends React.Component {

    // the fallbacks are the ones the geometry uses when nothing is stored
    state = {
        columns: clampCells((this.props.properties.storyboard || {}).columns, 3),
        rows: clampCells((this.props.properties.storyboard || {}).rows, 2),
        frame: (this.props.properties.storyboard || {}).frame === 'browser' ? 'browser' : 'phone'
    }

    onChange = (key, value) => {
        this.setState({
            [key]: value
        }, () => {
            this.props.onNewProperties(
                'storyboard',
                {
                    ...this.state
                })
        })
    }

    render = () => {

        return (
            <div className="mkp-prop-menu-component">
                <div className="mkp-prop-menu-row">
                    <div className="mkp-prop-menu-title">
                        Set Storyboard Grid
                    </div>
                </div>
                <div className="mkp-prop-menu-row">
                    <div className="mkp-prop-menu-label">Columns:</div>
                    <input className="mkp-prop-menu-input" type="number" min="1" max={MAX_STORYBOARD_CELLS}
                            value={this.state.columns}
                            onChange={(e) => this.onChange('columns', clampCells(e.target.value))}/>
                    <div className="mkp-prop-menu-label">Rows:</div>
                    <input className="mkp-prop-menu-input" type="number" min="1" max={MAX_STORYBOARD_CELLS}
                            value={this.state.rows}
                            onChange={(e) => this.onChange('rows', clampCells(e.target.value))}/>
                </div>
                <div className="mkp-prop-menu-row">
                    <div className="mkp-prop-menu-label">Frame:</div>
                    <select className="mkp-prop-menu-input" value={this.state.frame}
                            onChange={(e) => this.onChange('frame', e.target.value)}>
                        <option value="phone">Phone</option>
                        <option value="browser">Browser</option>
                    </select>
                </div>
            </div>
        )
    }

}


// The sheet layouts the widget geometry knows how to draw
const WIDGET_LAYOUTS = [
    {value: 'mixed', label: 'One 4×2 and two 2×2'},
    {value: 'small', label: 'Four 2×2'},
    {value: 'wide', label: 'Two 4×2'}
]

class WidgetsPropertiesMenu extends React.Component {

    state = {
        layout: (this.props.properties.widgets || {}).layout || 'mixed'
    }

    onChange = (value) => {
        this.setState({
            layout: value
        }, () => {
            this.props.onNewProperties('widgets', {...this.state})
        })
    }

    render = () => {

        return (
            <div className="mkp-prop-menu-component">
                <div className="mkp-prop-menu-row">
                    <div className="mkp-prop-menu-title">
                        Set Widget Sizes
                    </div>
                </div>
                <div className="mkp-prop-menu-row">
                    <div className="mkp-prop-menu-label">Layout:</div>
                    <select className="mkp-prop-menu-input" value={this.state.layout}
                            onChange={(e) => this.onChange(e.target.value)}>
                        {WIDGET_LAYOUTS.map((layout) =>
                            <option value={layout.value} key={layout.value}>{layout.label}</option>)}
                    </select>
                </div>
            </div>
        )
    }

}


class BackgroundPatternMenu extends React.Component {

    state = {
        patternType: this.props.backgroundData.patternType,
        patternDimensionInMM: parseInt(this.props.backgroundData.patternDimensionInMM)
    }

    onPatternDimChange = (e) => {
        let newVal = e.target.value
        this.setState({
            patternDimensionInMM: parseInt(newVal)
        }, () => {
            this.props.onNewProperties(
                'backgroundData',
                {
                    ...this.state
                })
        })
    }

    onPatternTypeChange = (newVal) => {
        this.setState({
            patternType: newVal
        }, () => {
            this.props.onNewProperties(
                'backgroundData',
                {
                    ...this.state
                })
        })
    }

    render = () => {

        let patternTypes = ['empty', 'dots', 'lines', 'squares']
        let patternElements = []

        let index = 0
        for (const pType of patternTypes) {
            let className = "mkp-prop-menu-list-item"
            if (this.state.patternType === pType) {
                className += ' mkp-selected-pattern'
            }
            patternElements.push(
                <div className={className} onClick={this.onPatternTypeChange.bind(null, pType)} key={index++}>
                    <PatternSelectorIcon type={pType}  />
                </div>
            )
        }

        return (
            <div className="mkp-prop-menu-component">
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
            </div>
        )
    }

}

// Which option groups a mockup shows, in the order they appear
const SUBMENUS = {
    'notes-mockup': ['background', 'border'],
    'android-mockup': ['background', 'navBar'],
    'tv-mockup': ['background', 'stand'],
    'car-mockup': ['background', 'controls'],
    'kiosk-mockup': ['background', 'stand'],
    'widgets-mockup': ['widgets', 'background'],
    'sticky-note-mockup': ['background', 'fold'],
    'storyboard-mockup': ['storyboard', 'background'],
    'title-block-mockup': []
}

const DEFAULT_SUBMENUS = ['background']

export default class PropertiesMenu extends React.Component {

    state = {
       ...this.props.properties
    }

    onSave = () => {
        this.props.onSave({...this.state})
    }

    onNewProperties = (key, value) => {
        let currentProps = {...this.state}
        currentProps[key] = value        
        this.setState({...currentProps})
    }

    render = () => {

        let subMenus = []

        for (const name of SUBMENUS[this.props.componentType] || DEFAULT_SUBMENUS) {
            if (name === 'background') {
                subMenus.push(<BackgroundPatternMenu backgroundData={this.state.backgroundData} onNewProperties={this.onNewProperties} key="bg-props"/>)
            } else if (TOGGLES[name]) {
                subMenus.push(<TogglePropertyMenu group={name} properties={this.state} onNewProperties={this.onNewProperties} key={name + '-props'}/>)
            } else if (name === 'storyboard') {
                subMenus.push(<StoryboardPropertiesMenu properties={this.state} onNewProperties={this.onNewProperties} key="storyboard-props"/>)
            } else if (name === 'widgets') {
                subMenus.push(<WidgetsPropertiesMenu properties={this.state} onNewProperties={this.onNewProperties} key="widgets-props"/>)
            }
        }

        if (subMenus.length === 0) {
            subMenus.push(
                <div className="mkp-prop-menu-component" key="no-props">
                    <div className="mkp-prop-menu-row">
                        <div className="mkp-prop-menu-label">This mockup has no options.</div>
                    </div>
                </div>
            )
        }

        return (
            <div className="mkp-prop-menu-container">
                {subMenus}
                <div className="mkp-prop-menu-footer">
                    <button className="mkp-prop-menu-btn" onClick={this.props.onClose}>Cancel</button>
                    <button className="mkp-prop-menu-btn mkp-prop-menu-btn-save" onClick={this.onSave}>Apply</button>
                </div>
            </div>
        )
    }
}