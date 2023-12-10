import { Cartridge } from "./cartridge"
import { Mbc1Cartridge } from "./mbc1Cartridge"

// Reference: https://gbdev.io/pandocs/The_Cartridge_Header.html#0147--cartridge-type
export async function createCartridge(file: File): Promise<Cartridge> {
  const romData = (
    await file.stream().getReader().read()
  ).value

  if (!romData) { throw new Error("Unable to read file") }

  const cartridgeType = romData[0x147]

  switch(cartridgeType) {
    case 0x00: return new Cartridge(romData)
    case 0x01: return new Mbc1Cartridge(romData)
  }

  throw new Error("Unknown cartridge type: " + cartridgeType)
}