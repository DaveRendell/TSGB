import { SerialConnection } from "./serialConnection";

// https://gbdev.io/pandocs/Gameboy_Printer.html
export class PrinterConnection implements SerialConnection {
  packetBuffer: number[] = []
  status = 0x00

  onReceiveByteFromConsole(byte: number): number {
    this.packetBuffer.push(byte)

    if (!this.bufferIsValid()) {
      console.log("[PRINTER]: Invalid packet", [...this.packetBuffer])
      this.packetBuffer = []
    } else if (this.bufferIsFinished()) {
      this.executeCommand()
    }
    // TODO check if buffer is complete

    return this.status
  }

  private bufferIsValid(): boolean {
    if (this.packetBuffer.length >= 1 && this.packetBuffer[0] !== 0x88) {
      return false
    }

    if (this.packetBuffer.length >= 2 && this.packetBuffer[1] !== 0x33) {
      return false
    }

    return true
  }

  private bufferIsFinished(): boolean {
    if (this.packetBuffer.length < 10) { return false }
    const dataLength = this.packetBuffer[4] + (this.packetBuffer[5] << 8)
    return this.packetBuffer.length >= 10 + dataLength
  }

  private executeCommand(): void {
    const commandId = this.packetBuffer[2]
    
    console.log(`[PRINTER]: Command 0x${commandId.toString(16).padStart(2, "0")} received`)

    this.packetBuffer = []
  }
}