import SuperEmulator from "../superEmulator";

// https://gbdev.io/pandocs/SGB_Command_Attribute.html#sgb-command-06--attr_div
export default function attributeDivide(superEmulator: SuperEmulator, data: number[]) {
  const flags = data[0]

  const positivePalette = (flags >> 0) & 0x3
  const negativePalette = (flags >> 2) & 0x3
  const dividerPalette = (flags >> 4) & 0x3
  const dimension = (flags & 0x40) === 0 ? "vertical" : "horizontal"

  const coordinate = data[1]

  superEmulator.log("ATTR_DIV command received", { positivePalette, negativePalette, dividerPalette, dimension, coordinate })

  if (dimension === "horizontal") {
    superEmulator.attributes.setDivideHorizontalAbove(coordinate, negativePalette)
    superEmulator.attributes.setDivideHorizontalBelow(coordinate, positivePalette)
    superEmulator.attributes.setHorizontalLine(coordinate, dividerPalette)
  } else {
    superEmulator.attributes.setDivideVerticalLeft(coordinate, negativePalette)
    superEmulator.attributes.setDivideVerticalRight(coordinate, positivePalette)
    superEmulator.attributes.setVerticalLine(coordinate, dividerPalette)
  }
}