




const getMMToPixelFactor = (pageOrientation = 'landscape') => {
    let A4_Width_MM = 297
    let A4_Height_MM = 210
    let A4_Width_Pixels = 1000
    let A4_Height_Pixels = 707

    if (pageOrientation === 'portrait') {
        A4_Width_MM = 210
        A4_Height_MM = 297
        A4_Width_Pixels = 707
        A4_Height_Pixels = 1000
    }

    return A4_Width_MM / A4_Width_Pixels  
}

export const mmToPixels = (mmValue, pageOrientation) => Math.floor(mmValue * 1 / getMMToPixelFactor(pageOrientation))

export const pixelsToMM = (pixelsValue, pageOrientation) => Math.floor(pixelsValue * getMMToPixelFactor(pageOrientation))