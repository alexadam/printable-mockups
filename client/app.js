import React from 'react';
import ReactDOM from 'react-dom';
import './style.scss';

import {BrowserMockup, PhoneMockup, WatchMockup} from './svg-utils'
import * as PDFUtils from './svg-pdf'

import MyGoldenLayout from './mockup-editor'

class EditModeMenu extends React.Component {

    state = {
        mode: 'edit'
    }

    chageToView = () => {
        this.setState({
            mode: 'view'
        })
    }
    chageToEdit = () => {
        this.setState({
            mode: 'edit'
        })
    }

    render = () => {

        let lClass = 'mkp-edit-mode '
        let pClass = 'mkp-edit-mode '

        if (this.state.mode === 'edit') {
            lClass += ' mkp-edit-selected'
        } else {
            pClass += ' mkp-edit-selected'
        }

        // eye icon https://www.iconfinder.com/icons/171461/eye_icon
        // layout icon https://www.iconfinder.com/icons/809314/interface_layout_sidebar_right_icon

        return (
            <div className="mkp-tm-group">
                <div className={lClass} onClick={this.chageToEdit}>
                    <svg height="24px" viewBox="0 0 24 24" width="24px"><path d="M22.9,0H1.1C0.5,0,0,0.5,0,1.1v21.8C0,23.5,0.5,24,1.1,24h21.8c0.6,0,1.1-0.5,1.1-1.1V1.1C24,0.5,23.5,0,22.9,0z M2,22V9h13  v13H2z M22,22h-6V9h6V22z M22,8H2V2h20V8z"/></svg>
                </div>
                <div className={pClass} onClick={this.chageToView}>
                    <svg
                        height="30px"
                        viewBox="-0.709 -32.081 141.732 141.732"
                        width="30px">
                        <g><path
                            d="M89.668,38.786c0-10.773-8.731-19.512-19.51-19.512S50.646,28.01,50.646,38.786c0,10.774,8.732,19.511,19.512,19.511   C80.934,58.297,89.668,49.561,89.668,38.786 M128.352,38.727c-13.315,17.599-34.426,28.972-58.193,28.972   c-23.77,0-44.879-11.373-58.194-28.972C25.279,21.129,46.389,9.756,70.158,9.756C93.927,9.756,115.036,21.129,128.352,38.727    M140.314,38.76C125.666,15.478,99.725,0,70.158,0S14.648,15.478,0,38.76c14.648,23.312,40.591,38.81,70.158,38.81   S125.666,62.072,140.314,38.76"/></g></svg>
                </div>
            </div>
        )

    }
}

class MasureUnitsMenu extends React.Component {

    state = {
        isUnitsVisible: false,
        unit: 'cm'
    }

    toggleUnits = () => {
        this.setState({
            isUnitsVisible: !this.state.isUnitsVisible
        })
    }

    changeUnit = (e) => {
        console.log(e.target.value);
    }

    render = () => {

        let toggleUnitsClass = 'mkp-toggle-units'

        let units = null
        if (this.state.isUnitsVisible) {
            toggleUnitsClass += ' mkp-menu-selected'

            units = (
                <div className={toggleUnitsClass}>
                    <select value={this.state.unit} onChange={this.changeUnit}>
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                    </select>
                </div>
            )
        }

        // icon src https://www.iconfinder.com/icons/296914/control_measure_ruler_tools_triangular_icon
        // line icon https://www.iconfinder.com/icons/4470683/measure_measurement_ruler_icon
        return (
            <div className="mkp-tm-group">
                <div className={toggleUnitsClass} onClick={this.toggleUnits}>



                    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                        <g transform="rotate(45 32 32)"><path
                            d="M45.44,5.84,5.84,45.44,18.56,58.16l39.6-39.6ZM18.56,55.33,8.67,45.44l2.82-2.83L15,46.14l1.41-1.41-3.53-3.54,2.83-2.83,5,5L22.1,41.9l-5-4.95L20,34.12l3.53,3.54,1.42-1.42-3.54-3.53,2.83-2.83,5,4.95,1.42-1.42-4.95-4.95,2.82-2.82L32,29.17l1.41-1.41-3.53-3.54,2.83-2.83,4.95,4.95,1.41-1.41-5-4.95L37,17.15l3.54,3.54,1.41-1.42-3.54-3.53,2.83-2.83,5,4.95,1.42-1.42-5-5,2.83-2.82,9.89,9.89Z"/></g>
                    </svg>
                </div>
                {units}
            </div>
        )
    }
}

class PaperOrientationSelector extends React.Component {

    state = {
        orientation: 'landscape'
    }

    chageToLandscape = () => {
        this.setState({
            orientation: 'landscape'
        }, () => this.props.onPaperOrientationChange('landscape'))
    }
    chageToPortrait = () => {
        this.setState({
            orientation: 'portrait'
        }, () => this.props.onPaperOrientationChange('portrait'))
    }

    render = () => {

        let lClass = 'mkp-pom-landscape mkp-pom-item'
        let pClass = 'mkp-pom-portrait mkp-pom-item'

        if (this.state.orientation === 'landscape') {
            lClass += ' mkp-pom-selected'
        } else {
            pClass += ' mkp-pom-selected'
        }

        return (
            <div className="mkp-page-orientation-menu mkp-tm-group">
                <div className={lClass} onClick={this.chageToLandscape} title="Landscape"></div>
                <div className={pClass} onClick={this.chageToPortrait} title="Portrait"></div>
            </div>
        )

    }
}

class SettingsMenu extends React.Component {

    state = {
        isVisible: false
    }

    componentDidMount = () => {
        document.onkeydown = (evt) => {
            evt = evt || window.event;
            var isEscape = false;
            if ("key" in evt) {
                isEscape = (evt.key === "Escape" || evt.key === "Esc");
            } else {
                isEscape = (evt.keyCode === 27);
            }
            if (isEscape) {
                if (this.state.isVisible) {
                    this.toggleSettingsMenu()
                }
            }
        };
    }

    toggleSettingsMenu = (e) => {
        this.setState({
            isVisible: !this.state.isVisible
        })
    }

    saveAsSVG = () => {
        alert("Not implemented yet! Work in progress...")
        // let allSVGElems = document.getElementsByClassName('mkp-svg')
        // let result = '<svg viewBox="0 0 80 20" xmlns="http://www.w3.org/2000/svg">'

        // TODO see SVG Symbols https://css-tricks.com/svg-symbol-good-choice-icons/
        // and https://developer.mozilla.org/en-US/docs/Web/SVG/Element/symbol

        // for (const svgElem of allSVGElems) {
        //     let bbox = svgElem.getBoundingClientRect()
        //     let viewBox = 
        //     let svgContent = 
        // }


        // result += '</svg>'
    }

    saveAsJSON = () => {
        alert("Not implemented yet! Work in progress...")
    }

    importJSON = () => {
        alert("Not implemented yet! Work in progress...")
    }

    render = () => {

        let menu = null
        if (this.state.isVisible) {
            menu = (
                <div className="mkp-settings-menu-bg" onClick={this.toggleSettingsMenu}>
                     <div className="mkp-settings-menu-container">
                        <button className="mkp-settings-menu-button" onClick={this.saveAsSVG}>Save as SVG</button>
                        <button className="mkp-settings-menu-button" onClick={this.saveAsJSON}>Save as JSON</button>
                        <div className="mkp-settings-menu-separator"></div>
                        <button className="mkp-settings-menu-button" onClick={this.importJSON}>Import JSON</button>
                    </div>
                </div>
            )
        }

        return (
            <div className="mkp-settings-menu">
                <button className="mkp-save-menu-button save-as-pdf-button" onClick={this.props.savePdf} title="Save as PDF">Save as PDF</button>
                <button className="mkp-settings-menu-toggle-button" onClick={this.toggleSettingsMenu} title="More Settings">&#8964;</button>
                {menu}
            </div>
        )
    }
}

class App extends React.Component {

    constructor(props) {
        super(props);
        this.GoldenLayout = React.createRef();
    }

    state = {
        paperOrientation: 'landscape'
    }

    getLayoutData = () => {
        let data = this.GoldenLayout.current.getLayoutData()
        let paperDim = this.GoldenLayout.current.getPaperDimensions()

        // TODO
        console.log('layout data', data, 'PD', paperDim);
    }

    prepareSVGData = () => {
        let container = document.getElementById('layoutContainer')
        let containerSize = container.getBoundingClientRect()

        let data = {
            paper: {
                orientation: this.state.paperOrientation,
                widthPixels: containerSize.width,
                heightPixels: containerSize.height,
                containerOffsetX: containerSize.left,
                containerOffsetY: containerSize.top
            },
            forms: []
        }

        let svgElems = document.getElementsByClassName('mkp-svg')
        for (let svgElem of svgElems) {
            let type = svgElem.getAttribute('type')

            let size = null
            size = svgElem.getBoundingClientRect()

            // let children = svgElem.children;
            // for (let child of children) {
            //     if (child.tagName === 'g') {
            //         size = child.getBoundingClientRect()
            //         // TODO remove / test different heights
            //         // let tttt = svgElem.getBoundingClientRect()
            //     }
            // }

            let qualityFactor = 1

            let originalWidth = svgElem.style.width
            let originalHeight = svgElem.style.height
            svgElem.style.width = parseInt(svgElem.style.width) * qualityFactor + 'px'
            svgElem.style.height = parseInt(svgElem.style.height) * qualityFactor + 'px'

            let svgAsText = new XMLSerializer().serializeToString(svgElem);

            svgElem.style.height = originalHeight
            svgElem.style.width = originalWidth

            data.forms.push({
                type,
                size,
                svgAsText,
                options: {}
            })
        }

        return data
    }

    savePdf = () => {
        let data = this.prepareSVGData()
        PDFUtils.createTestPDF(data)
    }

    onPaperOrientationChange = (newOrientation) => {
        this.setState({
            paperOrientation: newOrientation
        }, () => this.GoldenLayout.current.paperSizeChange(newOrientation))
    }

    render = () => {

        // <EditModeMenu />
        
        return (
            <div className="app">
                <div className="mkp-top-menu-container">
                    <div className="mkp-top-menu-logo">
                        Printable Mockups
                    </div>
                    <div className="mkp-top-menu-buttons-container">
                        <PaperOrientationSelector onPaperOrientationChange={this.onPaperOrientationChange} />
                        <MasureUnitsMenu />
                        <SettingsMenu savePdf={this.savePdf}/>
                    </div>
                </div>
                <MyGoldenLayout ref={this.GoldenLayout} />
            </div>
        )
    }
}

ReactDOM.render((
    <App/>
), document.getElementById('app'));
