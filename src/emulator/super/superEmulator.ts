import { valueDisplay } from "../../helpers/displayHexNumbers"
import SgbScanlineRenderer from "../graphics/sgbScanlineRenderer"
import { TileStore } from "../memory/tileStore"
import AttributeFile from "./attributeFile"
import attributeBlock from "./commands/attributeBlock"
import attributeCharacters from "./commands/attributeCharacters"
import attributeDivide from "./commands/attributeDivide"
import attributeLine from "./commands/attributeLine"
import attributeTransfer from "./commands/attributeTransfer"
import characterTransfer from "./commands/characterTransfer"
import maskEnable from "./commands/maskEnable"
import palettePair from "./commands/palettePair"
import paletteSet from "./commands/paletteSet"
import paletteTransfer from "./commands/paletteTransfer"
import tilemapTransfer from "./commands/tilemapTransfer"
import SuperPalette from "./superPalette"

type VramTransferType =
  "palette"
  | "attribute"
  | "character"
  | "tilemap"

interface TileMapEntry {
  tileId: number,
  paletteId: number,
  flipX: boolean,
  flipY: boolean,
}

export default class SuperEmulator {
  scanlineRenderer: SgbScanlineRenderer

  // Receiving packet data
  packetsLeftInCommand = 0
  packetCommandCode = 0
  packetDataBuffer: number[] = []

  // Receiving VRAM transfer
  vramTransferType: VramTransferType = "palette"
  tileDestination: 0 | 0x1000 = 0

  // 512 Palettes in Super RAM
  storedPalettes: SuperPalette[] = [
    new SuperPalette([0xBF, 0x67, 0x5B, 0x26, 0xB5, 0x10, 0x66, 0x28]),
    new SuperPalette([0x7B, 0x63, 0xD9, 0x3A, 0x56, 0x09, 0x00, 0x00]),
    new SuperPalette([0x1F, 0x7F, 0x7D, 0x2A, 0xF3, 0x30, 0xE7, 0x4C]),
    new SuperPalette([0xFF, 0x57, 0x18, 0x26, 0x1F, 0x00, 0x6A, 0x00]),
    new SuperPalette([0x7F, 0x5B, 0x0F, 0x3F, 0x2D, 0x22, 0xEB, 0x10]),
    new SuperPalette([0xBB, 0x7F, 0x3C, 0x2A, 0x15, 0x00, 0x00, 0x09]),
    new SuperPalette([0x00, 0x28, 0x80, 0x76, 0xEF, 0x01, 0xFF, 0x2F]),
    new SuperPalette([0xBF, 0x73, 0xFF, 0x46, 0x10, 0x01, 0x66, 0x00]),
    new SuperPalette([0x3E, 0x53, 0x38, 0x26, 0xE5, 0x01, 0x00, 0x00]),
    new SuperPalette([0xFF, 0x7F, 0xBF, 0x2B, 0xDF, 0x00, 0x0A, 0x2C]),
    new SuperPalette([0x1F, 0x7F, 0x3D, 0x46, 0xCF, 0x74, 0xA5, 0x4C]),
    new SuperPalette([0xFF, 0x53, 0xE0, 0x03, 0xDF, 0x00, 0x00, 0x28]),
    new SuperPalette([0x3F, 0x43, 0xD2, 0x72, 0x45, 0x30, 0x22, 0x08]),
    new SuperPalette([0xFA, 0x7F, 0x5F, 0x2A, 0x14, 0x00, 0x03, 0x00]),
    new SuperPalette([0xED, 0x1E, 0x5C, 0x21, 0xFC, 0x42, 0x60, 0x00]),
    new SuperPalette([0xFF, 0x7F, 0xF7, 0x5E, 0xCE, 0x39, 0x00, 0x00]),
    new SuperPalette([0x5F, 0x4F, 0x0E, 0x63, 0x9F, 0x15, 0x26, 0x31]),
    new SuperPalette([0x7B, 0x63, 0x1C, 0x12, 0x40, 0x01, 0x40, 0x08]),
    new SuperPalette([0xBC, 0x66, 0xFF, 0x3F, 0xE0, 0x7E, 0x84, 0x2C]),
    new SuperPalette([0xFE, 0x5F, 0xBC, 0x3E, 0x21, 0x03, 0x00, 0x00]),
    new SuperPalette([0xFF, 0x63, 0xDC, 0x36, 0xF6, 0x11, 0x2A, 0x39]),
    new SuperPalette([0xEF, 0x65, 0xBF, 0x7D, 0x5F, 0x03, 0x08, 0x21]),
    new SuperPalette([0x6C, 0x2B, 0xFF, 0x7F, 0xD9, 0x1C, 0x07, 0x00]),
    new SuperPalette([0xFC, 0x53, 0x2F, 0x1F, 0x29, 0x0E, 0x61, 0x00]),
    new SuperPalette([0xBE, 0x36, 0xAF, 0x7E, 0x1A, 0x68, 0x00, 0x3C]),
    new SuperPalette([0xBE, 0x7B, 0x9D, 0x32, 0xE8, 0x1D, 0x23, 0x04]),
    new SuperPalette([0x9F, 0x73, 0x9B, 0x6A, 0x93, 0x72, 0x01, 0x00]),
    new SuperPalette([0xFF, 0x5F, 0x32, 0x67, 0xA9, 0x3D, 0x81, 0x24]),
    new SuperPalette([0x7F, 0x57, 0xBC, 0x3E, 0x6F, 0x45, 0x80, 0x18]),
    new SuperPalette([0x57, 0x6B, 0x1B, 0x6E, 0x10, 0x50, 0x07, 0x00]),
    new SuperPalette([0x96, 0x0F, 0x97, 0x2C, 0x45, 0x00, 0x00, 0x32]),
    new SuperPalette([0xFF, 0x67, 0x17, 0x2F, 0x30, 0x22, 0x48, 0x15]),
  ]

  // 45 Attribute files in Super RAM
  storedAttributeFiles: number[][][]

  // Display palettes
  palettes: SuperPalette[] = this.storedPalettes.slice(0, 4)
  // Currently displayed screen attributes
  attributes: AttributeFile = new AttributeFile()

  // Border data
  borderTiles = new TileStore(256, 4)
  tilemap: TileMapEntry[] = new Array(32 * 28).map(_ => ({
    tileId: 0, paletteId: 0, flipX: false, flipY: false,
  }))

  commandLog: string[] = []

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

      case 0x07: // ATTR_CHR
        return attributeCharacters(this, data)
        
      case 0x0B: // PAL_TRN
        return paletteTransfer(this)
      
      case 0x0A: // PAL_SET
        return paletteSet(this, data)

      case 0x13: // CHR_TRN
        return characterTransfer(this, data)

      case 0x14: // PCT_TRN
        return tilemapTransfer(this)

      case 0x15: // ATTR_TRN
        return attributeTransfer(this)

      case 0x17: // MASK_EN
        return maskEnable(this, data)
    }

    this.log(`Received unsupported command ${valueDisplay(commandCode)} - ${commandName(commandCode)} with data`, data)
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
        break
      
      case "attribute":
        this.storedAttributeFiles = []
        for (let fileId = 0; fileId < 45; fileId++) {
          const file: number[][] = []
          for (let row = 0; row < 18; row++) {
            file.push(
              bytes.slice(90 * fileId + 5 * row).slice(0, 5).flatMap(byte => [
                (byte >> 6) & 0x3,
                (byte >> 4) & 0x3,
                (byte >> 2) & 0x3,
                (byte >> 0) & 0x3,
              ])
            )
          }
          this.storedAttributeFiles.push(file)
        }
        console.log("[SUPER] Stored VRAM transfer in Attributes", this.storedAttributeFiles)
        break

      case "character":
        let byteCursor = this.tileDestination
        bytes.slice(0, 0x1000).forEach(byte => this.borderTiles.writeByte(byteCursor++, byte))
        console.log("[SUPER] Border tile data transfer complete")
        break

      case "tilemap":
        for (let i = 0; i < 32 * 28; i++) {
          const tileId = data[2 * i]
          const attributeByte = data[2 * i + 1]
          const paletteId = attributeByte & 3
          const flipX = (attributeByte & 0x40) > 0
          const flipY = (attributeByte & 0x80) > 0
          this.tilemap[i] = { tileId, paletteId, flipX, flipY }
        }
        // TODO 3 border palettes 800-85F
        break
    }
  }

  log(line: string, ...params: any[]) {
    this.commandLog.push(`${line} - ${JSON.stringify(params)}`)
    console.log("[SUPER] " + line, ...params)
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