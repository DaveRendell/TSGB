import SuperEmulator from "../superEmulator";

export default function attributeCharacters(superEmulator: SuperEmulator, data: number[]) {
  const xStart = data[0]
  const yStart = data[1]
  const dataSetCount = data[2] + (data[3] << 8)
  const direction = data[4] === 0 ? +1 : -1
  const dataSets = data.slice(5).flatMap(byte => [
    (byte >> 6) & 0x3,
    (byte >> 4) & 0x3,
    (byte >> 2) & 0x3,
    (byte >> 0) & 0x3,
  ]).slice(0, dataSetCount)

  superEmulator.log("ATTR_CHR command received", { xStart, yStart, direction, dataSets })

  superEmulator.attributes.setCharacters(xStart, yStart, direction, dataSets)
}