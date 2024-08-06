import { valueDisplay } from "../../helpers/displayHexNumbers"
import SgbScanlineRenderer from "../graphics/sgbScanlineRenderer"
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

  // Palettes in Super RAM as raw bytes
  storedPalettes: number[] = []

  // Display palettes
  palettes: SuperPalette[] = [
    new SuperPalette(),
    new SuperPalette(),
    new SuperPalette(),
    new SuperPalette(),
  ]

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
    const name = commandName(commandCode)
    console.log(`[SUPER] Received command ${valueDisplay(commandCode)} - ${name} with data [${data.map(x => valueDisplay(x)).join(",")}]`)

    switch(commandCode) {
      case 0x0B: // PAL_TRN
        this.scanlineRenderer.vramTransferRequested = true
        this.vramTransferType = "palette"
        break
      
      case 0x0A: // PAL_SET
        let paletteIds = []
        for (let i = 0; i < 4; i++) {
          const paletteId = wordFromBytes(
            data[(i << 1) + 1],
            data[(i << 1) + 0])
          const paletteByteOffset = paletteId << 3
          this.palettes[i].setFromBytes(
            this.storedPalettes.slice(paletteByteOffset, paletteByteOffset + 8))
          paletteIds.push(paletteId)
        }

        const flags = data[8]
        const applyAtf = (flags & 0x80) > 0
        const cancelMask = (flags & 0x40) > 0
        const atfId = flags & 0x3F
        console.log("PAL_SET parsed", {
          paletteIds,
          flags: flags.toString(2),
          applyAtf,
          cancelMask,
          atfId,
        })
        
        break
    }
  }

  receiveVramTransfer(data: number[]): void {
    const bytes = []
    let cursor = 0
    for (let i = 0; i < 2048; i++) {
      let byte1 = 0
      let byte2 = 0
      for (let j = 0; j < 8; j++) {
        const pixel = data[cursor++]
        byte1 |= ((pixel & 1) << j)
        byte2 |= ((pixel >> 1) << j)
      }
      bytes.push(byte1)
      bytes.push(byte2)
    }

    console.log("[SUPER] Decoded bytes from VRAM transfer", bytes)
    
    switch(this.vramTransferType) {
      case "palette":
        this.storedPalettes = bytes
        console.log("[SUPER] Stored VRAM transfer in Palettes")
    }
  }
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

function wordFromBytes(h: number, l: number): number {
  return (h << 8) + l
}