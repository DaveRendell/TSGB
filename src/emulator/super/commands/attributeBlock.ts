import SuperEmulator from "../superEmulator";

interface DataSet {
  setInterior: boolean
  setExterior: boolean
  setBoundary: boolean
  
  interiorPalette: number
  exteriorPalette: number
  boundaryPalette: number

  x1: number
  y1: number
  x2: number
  y2: number
}

// https://gbdev.io/pandocs/SGB_Command_Attribute.html#sgb-command-04--attr_blk
export default function attributeBlock(superEmulator: SuperEmulator, data: number[]) {
  const dataSetCount = data[0]

  let dataSets: DataSet[] = []  
  for (let dataSetNumber = 0; dataSetNumber < dataSetCount; dataSetNumber++) {
    dataSets.push(
      parseDataSet(
        data.slice(
          1 + 6 * dataSetNumber,
          1 + 6 * (dataSetNumber + 1
          )
        )
      )
    )
  }

  console.log("[SUPER] ATTR_BLK command received", { dataSets })

  dataSets.forEach(dataSet => {
    if (dataSet.setInterior) {
      superEmulator.attributes.setBlockInterior(
        dataSet.x1, dataSet.y1, dataSet.x2, dataSet.y2,
        dataSet.interiorPalette
      )
    }
    if (dataSet.setExterior) {
      superEmulator.attributes.setBlockExterior(
        dataSet.x1, dataSet.y1, dataSet.x2, dataSet.y2,
        dataSet.exteriorPalette
      )
    }
    if (dataSet.setBoundary) {
      superEmulator.attributes.setBlockBoundary(
        dataSet.x1, dataSet.y1, dataSet.x2, dataSet.y2,
        dataSet.boundaryPalette
      )
    }
  })
}

function parseDataSet(data: number[]): DataSet {
  const controlCode = data[0]
  const setInterior = (controlCode & 0x1) > 0
  const setExterior = (controlCode & 0x4) > 0
  const setBoundary = (controlCode & 0x2) > 0 || (setInterior !== setExterior)

  const paletteIds = data[1]
  const interiorPalette = (paletteIds >> 0) & 0x3
  const boundaryPalette = (paletteIds >> 2) & 0x3
  const exteriorPalette = (paletteIds >> 4) & 0x3

  const x1 = data[2]
  const y1 = data[3]
  const x2 = data[4]
  const y2 = data[5]

  return {
    setInterior, setExterior, setBoundary,
    interiorPalette, exteriorPalette, boundaryPalette,
    x1, y1, x2, y2
  }
}