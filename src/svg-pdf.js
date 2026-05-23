import { jsPDF } from 'jspdf'
import { Canvg } from 'canvg'

const addSVG = async (doc, paperData, svgData, pixelToMMFactor) => {
    let canvasElem = document.createElement('canvas')
    canvasElem.width  = svgData.size.width;
    canvasElem.height = svgData.size.height;

    const ctx = canvasElem.getContext('2d');
    const v = await Canvg.from(ctx, svgData.svgAsText);
    await v.render();

    let imgData = canvasElem.toDataURL("image/jpeg", 1);

    doc.addImage(imgData, 'PNG',
        (svgData.size.left - paperData.containerOffsetX) * pixelToMMFactor,
        (svgData.size.top - paperData.containerOffsetY) * pixelToMMFactor,
        svgData.size.width  * pixelToMMFactor,
        svgData.size.height * pixelToMMFactor
    );
}

const createTestPDF = async (data) => {

    let A4_Width_MM = 297
    let A4_Height_MM = 210
    if (data.paper.orientation === 'portrait') {
        A4_Width_MM = 210
        A4_Height_MM = 297
    }
    let A4_widthToHeight = 1.414
    let pixelToMMFactor = A4_Width_MM / data.paper.widthPixels    

    let pdf = new jsPDF({
      orientation: data.paper.orientation,
      unit: 'mm',
      format: 'a4'
    })

    for (let form of data.forms) {
        await addSVG(pdf, data.paper, form, pixelToMMFactor)
    }

    if (data.paper.orientation === 'portrait') {
        pdf.text("Made with https://www.printablemockups.com/", 50, 294, { angle: 0 });
    } else {
        pdf.text("Made with https://www.printablemockups.com/", 100, 209, { angle: 0 });
    }

    pdf.save('printable-mockups.pdf')
}

export {createTestPDF}
