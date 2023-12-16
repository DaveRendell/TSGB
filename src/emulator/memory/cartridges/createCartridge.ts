import { Cartridge } from "./cartridge"
import { Mbc1Cartridge } from "./mbc1Cartridge"
import { Mbc3Cartridge } from "./mbc3Cartridge"

// Reference: https://gbdev.io/pandocs/The_Cartridge_Header.html#0147--cartridge-type

// PKM R: 0x13 [MBC3+RAM+BATTERY]
// LA: 0x03 [MBC1+RAM+BATTERY] (DX: 1b [MBC5+RAM+BATTERY])
export async function createCartridge(file: File): Promise<Cartridge> {
  const romData = (
    await file.stream().getReader().read()
  ).value

  if (!romData) { throw new Error("Unable to read file") }

  const cartridgeType = romData[0x147]

  switch(cartridgeType) {
    case 0x00:
      return new Cartridge(romData)
    case 0x01:
    case 0x02:
    case 0x03:
      return new Mbc1Cartridge(romData)
    case 0x0F:
    case 0x10:
    case 0x11:
    case 0x12:
    case 0x13:
      return new Mbc3Cartridge(romData)
  }

  throw new Error("Unknown cartridge type: " + cartridgeType)
}