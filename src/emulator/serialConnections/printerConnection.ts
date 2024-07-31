import { SerialConnection } from "./serialConnection";

// https://gbdev.io/pandocs/Gameboy_Printer.html
export class PrinterConnection implements SerialConnection {
  packetBuffer: number[] = []

  // Status bits
  lowBattery = false
  otherError = false
  paperJam = false
  packetError = false
  unprocessedData = false
  imageDataFull = false
  printing = false
  checksumError = false

  onReceiveByteFromConsole(byte: number): number {
    this.packetBuffer.push(byte)

    if (!this.bufferIsValid()) {
      console.log("[PRINTER]: Invalid packet", [...this.packetBuffer])
      this.packetBuffer = []
    } else if (this.packetBuffer.length === 9) {
      return 0x81 // Magic keep alive signal
    } else if (this.bufferIsFinished()) {
      this.executeCommand()
      return this.statusByte()
    }

    return 0x00
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
    const dataLength = this.packetBuffer[4] + (this.packetBuffer[5] << 8)
    const data = this.packetBuffer.slice(6, 6 + dataLength)
    const compressionFlag = this.packetBuffer[3] === 0x01
    
    switch (commandId) {
      case 0x01:
        this.initialise()
        break
      case 0x02:
        this.startPrinting(data)
        break
      case 0x04:
        this.fillBuffer(data, compressionFlag)
        break
      case 0x0F:
        this.nop()
        break
      default:
        console.log(`[PRINTER] Received unknown command ID 0x${commandId.toString(16).padStart(2, "0")}`)
    }

    this.packetBuffer = []
  }

  private initialise(): void {
    console.log("[PRINTER] Received command: INITIALISE")

    this.unprocessedData = false
    this.packetError = false
    this.checksumError = false
    this.otherError = false
  }

  private startPrinting(data: number[]): void {
    console.log("[PRINTER] Received command: START PRINTING")

    this.printing = true
    this.unprocessedData = false

    const printer = this
    setTimeout(() => {
      printer.printing = false
    }, 3000)
  }

  private fillBuffer(data: number[], compressed: boolean): void {
    console.log("[PRINTER] Received command: FILL BUFFER")
  }

  private nop(): void {
    console.log("[PRINTER] Received command: NOP")
  }

  private statusByte(): number {
    return (
      (this.lowBattery ? 0x80 : 0)
      + (this.otherError ? 0x40 : 0)
      + (this.paperJam ? 0x20 : 0)
      + (this.packetError ? 0x10 : 0)
      + (this.unprocessedData ? 0x08 : 0)
      + (this.imageDataFull ? 0x04 : 0)
      + (this.printing ? 0x02 : 0)
      + (this.checksumError ? 0x01 : 0)
    )
  }
}