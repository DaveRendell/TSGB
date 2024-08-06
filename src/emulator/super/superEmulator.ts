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
    console.log(`[SUPER] Received command code ${valueDisplay(commandCode)} with data [${data.map(x => valueDisplay(x)).join(",")}]`)
  }
}