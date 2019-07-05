import * as jsPDF from 'jspdf'
import canvg from 'canvg'

const addSVG = (doc, paperData, svgData, pixelToMMFactor) => {
    let canvasElem = document.createElement('canvas')
    canvasElem.width  = svgData.size.width;
    canvasElem.height = svgData.size.height;
    canvg(canvasElem, svgData.svgAsText);
    let imgData = canvasElem.toDataURL("image/png");

    doc.addImage(imgData, 'PNG',
        (svgData.size.left - paperData.containerOffsetX) * pixelToMMFactor,
        (svgData.size.top - paperData.containerOffsetY) * pixelToMMFactor,
        svgData.size.width * pixelToMMFactor,
        svgData.size.height * pixelToMMFactor
    );
}

const createTestPDF = (data) => {

    let A4_Width_MM = 297
    let A4_Height_MM = 210
    let A4_widthToHeight = 1.414
    let pixelToMMFactor = A4_Width_MM / data.paper.widthPixels

    let pdf = new jsPDF({
      orientation: data.paper.orientation,
      unit: 'mm',
      format: 'a4'
    })

    for (let form of data.forms) {
        addSVG(pdf, data.paper, form, pixelToMMFactor)
    }

    pdf.save('mockup.pdf')
}

export {createTestPDF}
