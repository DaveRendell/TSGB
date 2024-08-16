import { valueDisplay } from "../../helpers/displayHexNumbers"
import SgbScanlineRenderer from "../graphics/sgbScanlineRenderer"
import AttributeFile from "./attributeFile"
import attributeBlock from "./commands/attributeBlock"
import attributeDivide from "./commands/attributeDivide"
import attributeLine from "./commands/attributeLine"
import palettePair from "./commands/palettePair"
import paletteSet from "./commands/paletteSet"
import paletteTransfer from "./commands/paletteTransfer"
import SuperPalette from "./superPalette"

type VramTransferType =
  "palette"

export default class SuperEmulator {
  scanlineRenderer: SgbScanlineRenderer

  // Receiving packet data
  packetsLeftInCommand = 0
  packetCommandCode = 0
  packetDataBuffer: number[] = []

  // Receiving VRAM transfer
  vramTransferType: VramTransferType = "palette"

  // 512 Palettes in Super RAM
  storedPalettes: SuperPalette[] = []

  // 45 Attribute files in Super RAM
  storedAttributeFiles: AttributeFile[] = []

  // Display palettes
  palettes: SuperPalette[] = [ // TODO defaults
    new SuperPalette([0, 0, 0, 0, 0, 0, 0, 0]),
    new SuperPalette([0, 0, 0, 0, 0, 0, 0, 0]),
    new SuperPalette([0, 0, 0, 0, 0, 0, 0, 0]),
    new SuperPalette([0, 0, 0, 0, 0, 0, 0, 0]),
  ]
  // Currently displayed screen attributes
  attributes: AttributeFile = new AttributeFile()

  constructor() {

  }

  receivePacket(packet: number[]): void {
    // Check if this is first packet in a command or not
    if (this.packetsLeftInCommand === 0) {
      // This is header packet
      const headerByte = packet[0]
      const commandCode = headerByte >> 3
      const length = headerByte & 0x7

      packet.slice(1).forEach(byte =>
        this.packetDataBuffer.push(byte))
      this.packetCommandCode = commandCode

      this.packetsLeftInCommand = length - 1
    } else {
      packet.forEach(byte =>
        this.packetDataBuffer.push(byte))

      this.packetsLeftInCommand--
    }

    // Check if we've finished the command
    if (this.packetsLeftInCommand === 0) {
      this.processCommand(this.packetCommandCode, this.packetDataBuffer)
      this.packetCommandCode = 0
      this.packetDataBuffer = []
    }
  }

  // https://gbdev.io/pandocs/SGB_Command_Summary.html
  processCommand(commandCode: number, data: number[]): void {
    switch(commandCode) {
      case 0x00: // PAL01
        return palettePair(0, 1)(this, data)

      case 0x01: // PAL23
        return palettePair(2, 3)(this, data)

      case 0x02: // PAL03
        return palettePair(0, 3)(this, data)

      case 0x03: // PAL12
        return palettePair(1, 2)(this, data)

      case 0x04: // ATTR_BLK
        return attributeBlock(this, data)

      case 0x05: // ATTR_LIN
        return attributeLine(this, data)

      case 0x06: // ATTR_DIV
        return attributeDivide(this, data)
        
      case 0x0B: // PAL_TRN
        return paletteTransfer(this)
      
      case 0x0A: // PAL_SET
        return paletteSet(this, data)
    }

    console.log(`[SUPER] Received unsupported command ${valueDisplay(commandCode)} - ${commandName(commandCode)} with data [${data.map(x => valueDisplay(x)).join(",")}]`)
  }

  receiveVramTransfer(data: number[]): void {
    const bytes = vramDataFromPixelData(data)

    console.log("[SUPER] Decoded bytes from VRAM transfer", bytes)
    
    switch(this.vramTransferType) {
      case "palette":
        this.storedPalettes = []
        for (let i = 0; i < 512; i++) {
          this.storedPalettes.push(new SuperPalette(bytes.slice(i << 3, (i + 1) << 3)))
        }
        console.log("[SUPER] Stored VRAM transfer in Palettes")
    }
  }
}

function vramDataFromPixelData(data: number[]): number[] {
  const bytes = []

  // Run through pixel data tile by tile, row by row.
  // Two bytes per row, bit planes are interleaved.
  for (let tileId = 0; tileId < 0xFF; tileId++) {
    const tileX = tileId % 20
    const tileY = (tileId - tileX) / 20
    for (let row = 0; row < 8; row++) {
      let byte1 = 0
      let byte2 = 0
      const scanlineNumber = (tileY << 3) + row
      let cursor = (scanlineNumber * 160) + (tileX << 3)
      for (let i = 0; i < 8; i++) {
        const pixel = data[cursor++]
        byte1 |= ((pixel & 1) << (7 - i))
        byte2 |= ((pixel >> 1) << (7 - i))
      }
      bytes.push(byte1)
      bytes.push(byte2)
    }
  }
  return bytes
}

function commandName(commandCode: number): string {
  switch(commandCode) {
    // https://gbdev.io/pandocs/SGB_Command_Palettes.html
    case 0x00: return "PAL01"
    case 0x01: return "PAL23"
    case 0x02: return "PAL03"
    case 0x03: return "PAL12"
    case 0x0A: return "PAL_SET"
    case 0x0B: return "PAL_TRN"
    case 0x19: return "PAL_PRI"

    // https://gbdev.io/pandocs/SGB_Command_Attribute.html
    case 0x04: return "ATTR_BLK"
    case 0x05: return "ATTR_LIN"
    case 0x06: return "ATTR_DIV"
    case 0x07: return "ATTR_CHR"
    case 0x15: return "ATTR_TRN"
    case 0x16: return "ATTR_SET"

    // https://gbdev.io/pandocs/SGB_Command_Sound.html
    case 0x08: return "SOUND"
    case 0x09: return "SOU_TRN"

    // https://gbdev.io/pandocs/SGB_Command_System.html
    case 0x17: return "MASK_EN"
    case 0x0C: return "ATRC_EN"
    case 0x0D: return "TEST_EN"
    case 0x0E: return "ICON_EN"
    case 0x0F: return "DATA_SND"
    case 0x10: return "DATA_TRN"
    case 0x12: return "JUMP"

    // https://gbdev.io/pandocs/SGB_Command_Multiplayer.html
    case 0x11: return "MLT_REQ"

    // https://gbdev.io/pandocs/SGB_Command_Border.html
    case 0x13: return "CHR_TRN"
    case 0x14: return "PCT_TRN"
    case 0x18: return "OBJ_TRN"

    default: return "UNKNOWN_COMMAND_" + valueDisplay(commandCode)
  }
}