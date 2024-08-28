import { PalletteRegister } from "../memory/registers/lcdRegisters";
import { TileStore } from "../memory/tileStore";
import { SerialConnection } from "./serialConnection";

const COLOURS = [
  [255, 255, 255],
  [192, 192, 192],
  [96, 96, 96],
  [0, 0, 0],
]

// https://gbdev.io/pandocs/Gameboy_Printer.html
export class PrinterConnection implements SerialConnection {
  packetBuffer: number[] = []
  tileBuffer: TileStore = new TileStore(512)
  tileDataCursor = 0
  rowCursor = 0

  output = new OffscreenCanvas(160, 0)
  previousOutputs: OffscreenCanvas[] = []
  renderRowCursor = 0
  spurtCounter = 0

  // Status bits
  lowBattery = false
  otherError = false
  paperJam = false
  packetError = false
  unprocessedData = false
  imageDataFull = false
  printing = false
  checksumError = false

  onReceiveByteFromConsole(byte: number, respond: (byte: number) => void): void {
    this.packetBuffer.push(byte)

    if (!this.bufferIsValid()) {
      console.log("[PRINTER]: Invalid packet", [...this.packetBuffer])
      this.packetBuffer = []
    } else if (this.packetBuffer.length === 9) {
      respond(0x81) // Magic keep alive signal
      return
    } else if (this.bufferIsFinished()) {
      this.executeCommand()
      respond(this.statusByte())
      return
    }

    respond(0x00)
    return
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

    this.tileBuffer.clearTiles()
    this.tileDataCursor = 0

    this.unprocessedData = false
    this.packetError = false
    this.checksumError = false
    this.otherError = false
    this.imageDataFull = false
  }

  private startPrinting(data: number[]): void {
    console.log("[PRINTER] Received command: START PRINTING")

    const sheets = data[0]
    const preMargin = data[1] >> 4
    const postMargin = data[1] & 0xF
    const palette = data[2]
    const exposure = data[3]

    this.printing = true
    this.unprocessedData = false

    const printer = this

    this.spurtCounter = 20
    const rowsToPrint = this.tileDataCursor / (2 * 20)
    const outputRow = () => {
      if (printer.rowCursor < rowsToPrint) {
        printer.renderRow(palette)
        const nextTimeout = --this.spurtCounter === 0 ? 500 : 1000 / 60
        if (this.spurtCounter <= 0) { this.spurtCounter = 20 }
        setTimeout(outputRow, nextTimeout)
      } else {
        this.printing = false
        this.rowCursor = 0
      }
    }
    setTimeout(outputRow, 1000 / 60)
  }

  private fillBuffer(data: number[], compressed: boolean): void {
    console.log("[PRINTER] Received command: FILL BUFFER")

    if (compressed) {
      console.log("[PRINTER] Error - compression not yet supported")
    } else {
      for (let i = 0; i < data.length; i++) {
        this.tileBuffer.writeByte(this.tileDataCursor + i, data[i])
      }
      this.tileDataCursor += data.length
    }

    this.imageDataFull = this.tileDataCursor >= 8192
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

  private renderRow(palette: number): void {
    console.log("[PRINTER] Render row", this.renderRowCursor)
    const paletteRegister = new PalletteRegister()
    paletteRegister.byte = palette

    const context = this.output.getContext("2d")!
    if (this.output.height > 0) {
      const oldImageData = context.getImageData(0, 0, 160, this.output.height)
      this.output.height++
      context.putImageData(oldImageData, 0, 0)
    } else {
      this.output.height++
    }

    const imageData = context.createImageData(160, 1)

    const tileRow = this.rowCursor >> 3

    for (let i = 0; i < 160; i++) {
      const tileCol = i >> 3
      const tileId = (tileRow * 20) + tileCol
      const row = this.tileBuffer.readRow(tileId, this.rowCursor & 0x7)
      const pixel = paletteRegister.map[row[i & 0x7]]
      
      const colour = COLOURS[pixel]

      imageData.data[(i << 2) + 0] = colour[0]
      imageData.data[(i << 2) + 1] = colour[1]
      imageData.data[(i << 2) + 2] = colour[2]
      imageData.data[(i << 2) + 3] = 0xff
    }

    context.putImageData(imageData, 0, this.renderRowCursor)

    this.renderRowCursor++
    this.rowCursor++
  }

  isConnected: boolean = true

  updateClock(cycles: number): void {}
}