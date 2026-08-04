import {A4_SIZE_MM} from './print-constants'

/*
 * The paper is drawn at a fixed pixel size on screen; these convert between
 * that and real millimetres. No rounding: the values feed layout and export,
 * and a rounded millimetre is a visible error on paper.
 */
const A4_SIZE_PIXELS = {
    landscape: {width: 1000, height: 707},
    portrait: {width: 707, height: 1000}
}

const getMMToPixelFactor = (pageOrientation = 'landscape') => {
    let sizeMM = A4_SIZE_MM[pageOrientation] || A4_SIZE_MM.landscape
    let sizePixels = A4_SIZE_PIXELS[pageOrientation] || A4_SIZE_PIXELS.landscape

    return sizeMM.width / sizePixels.width
}

export const mmToPixels = (mmValue, pageOrientation) => mmValue / getMMToPixelFactor(pageOrientation)

export const pixelsToMM = (pixelsValue, pageOrientation) => pixelsValue * getMMToPixelFactor(pageOrientation)
