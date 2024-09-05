import SuperEmulator from "../superEmulator";

interface DataSet {
  dimension: "horizontal" | "vertical"
  coordinate: number,
  paletteId: number,
}

// https://gbdev.io/pandocs/SGB_Command_Attribute.html#sgb-command-05--attr_lin
export default function attributeLine(superEmulator: SuperEmulator, data: number[]) {
  const dataSetCount = data[0]

  const dataSets: DataSet[] = data.slice(1).map(byte => ({
    dimension: (byte & 0x80) === 0 ? "vertical" : "horizontal",
    coordinate: byte & 0xF,
    paletteId: (byte >> 4) & 0x3
  }))

  superEmulator.log("ATTR_LIN command recieved", { dataSets })

  dataSets.forEach(dataSet => {
    if (dataSet.dimension === "horizontal") {
      superEmulator.attributes.setHorizontalLine(dataSet.coordinate, dataSet.paletteId)
    } else {
      superEmulator.attributes.setVerticalLine(dataSet.coordinate, dataSet.paletteId)
    }
  })
}