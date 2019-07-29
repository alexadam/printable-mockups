import React from 'react'
import {PatternSelectorIcon} from './svg-utils'


const parseBoolean = (val) => {
    if (typeof val === "boolean") {
        return val
    } 
    return val === "true"
}

class BorderPropertiesMenu extends React.Component {

    state = {
        isBorderVisible: parseBoolean(this.props.properties.border.isBorderVisible)
    }

    onBorderVisibleChange = (e) => {
        this.setState({
            isBorderVisible: !this.state.isBorderVisible
        }, () => {            
            this.props.onNewProperties(
                'border',
                {
                    ...this.state
                })
        })
    }

    render = () => {

        return (
            <div className="mkp-prop-menu-component">
                <div className="mkp-prop-menu-row">
                    <div className="mkp-prop-menu-label">Display border:</div>
                    <input className="mkp-prop-menu-checkbox" type="checkbox" name="Is border visible" 
                            checked={this.state.isBorderVisible} onChange={this.onBorderVisibleChange}/>
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

        if (this.props.componentType === 'notes-mockup') {            
            subMenus.push(<BackgroundPatternMenu backgroundData={this.state.backgroundData} onNewProperties={this.onNewProperties} key="bg-props"/>)
            subMenus.push(<BorderPropertiesMenu properties={this.state} onNewProperties={this.onNewProperties} key="border-props"/>)
        } else {
            subMenus.push(<BackgroundPatternMenu backgroundData={this.state.backgroundData} onNewProperties={this.onNewProperties} key="bg-props"/>)
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