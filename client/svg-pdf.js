import * as jsPDF from 'jspdf'
import canvg from 'canvg'

const addSVG = (doc, svgData, posterData) => {
    let canvasElem = document.createElement('canvas')
    canvasElem.width  = 200;
    canvasElem.height = 200;
    canvg(canvasElem, svgData);
    let imgData = canvasElem.toDataURL("image/png");

    // let offsetX = centerHorizontal(posterData, svgData)
    // let offsetY = centerVertical(posterData, svgData)
    let offsetX = posterData.offsetX
    let offsetY = posterData.offsetY

    doc.addImage(imgData, 'PNG',
        10,
        10,
        100,
        100);
}

const createTestPDF = (svgAsText) => {

    let pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
  })

  // var svgAsText = new XMLSerializer().serializeToString(svgText.documentElement);
  // pdf.addSVG(svgAsText, 20, 20, pdf.internal.pageSize.width - 20*2)
  addSVG(pdf, svgAsText, {offsetX: 10, offsetY: 10, graphic: {width: 100, height: 300}})

  pdf.save('mockup.pdf')
}

export {createTestPDF}
