import { valueDisplay } from "../../helpers/displayHexNumbers"

export default class SuperEmulator {

  // Receiving data
  packetsLeftInCommand = 0
  packetCommandCode = 0
  packetDataBuffer: number[] = []

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

  processCommand(commandCode: number, data: number[]): void {
    const name = commandName(commandCode)
    console.log(`[SUPER] Received command ${valueDisplay(commandCode)} - ${name} with data [${data.map(x => valueDisplay(x)).join(",")}]`)
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