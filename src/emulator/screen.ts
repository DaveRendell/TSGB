import { MutableValue } from "../types";
import { increment } from "./arithmetic";
import CPU from "./cpu";
import { resetBit, setBit, testBit } from "./instructions/instructionHelpers";
import Memory from "./memory";

const WIDTH = 160
const HEIGHT = 144
const SCANLINES = 154

const COLOURS = [
  [255, 255, 255],
  [192, 192, 192],
  [96, 96, 96],
  [0, 0, 0],
]

type Mode = "HBlank" | "VBlank" | "Scanline OAM" | "Scanline VRAM"

export default class Screen {
  cpu: CPU
  memory: Memory
  canvas: HTMLCanvasElement
  buffer: OffscreenCanvas
  bufferContext: OffscreenCanvasRenderingContext2D

  lcdControl: MutableValue<8>
  lcdStatus: MutableValue<8>
  scrollX: MutableValue<8>
  scrollY: MutableValue<8>
  scanlineNumber: MutableValue<8>
  backgroundPallette: MutableValue<8>
  clockCount = 0

  gbDoctorHackManualScanline = 0

  mode: Mode = "Scanline OAM"

  newFrameDrawn = false

  constructor(cpu: CPU, canvas: HTMLCanvasElement) {
    this.cpu = cpu
    this.memory = cpu.memory
    this.canvas = canvas
    this.buffer = new OffscreenCanvas(WIDTH, HEIGHT)
    this.bufferContext = this.buffer.getContext("2d")!

    this.lcdControl = this.memory.at(0xFF40)
    this.lcdStatus = this.memory.at(0xFF41)
    this.scrollY = this.memory.at(0xFF42)
    this.scrollX = this.memory.at(0xFF43)
    this.scanlineNumber = this.memory.at(0xFF44)
    this.backgroundPallette = this.memory.at(0xFF47)

    cpu.addClockCallback(this)
    cpu.screen = this
  }

  // Returns true if new frame is rendered
  updateClock(cycle: number) {
    this.clockCount += cycle
    switch(this.mode) {
      case "HBlank":
        if (this.clockCount >= 204) {
          this.clockCount -= 204
          increment(this.scanlineNumber)
          this.gbDoctorHackManualScanline++
          if (this.gbDoctorHackManualScanline === HEIGHT) {
            this.renderScreen()
            setBit(this.memory.at(0xFF0F), 0) // VBlank interrupt flag ON
            this.mode = "VBlank"
            this.newFrameDrawn = true
          } else {
            this.mode = "Scanline OAM"
          }
        }
        break
      case "VBlank":
        if (this.clockCount >= 456) {
          this.clockCount -= 456
          increment(this.scanlineNumber)
          this.gbDoctorHackManualScanline++
          if (this.gbDoctorHackManualScanline >= SCANLINES) {
            this.scanlineNumber.write(0)
            this.gbDoctorHackManualScanline = 0
            this.mode = "HBlank"
            if (testBit(this.lcdStatus, 3)) {
              setBit(this.memory.at(0xFF0F), 1) // LCD interrupt flag ON
            }
          }
        }
        break
      case "Scanline OAM":
        if (this.clockCount >= 80) {
          this.clockCount -= 80
          this.mode = "Scanline VRAM"
        }
        break
      case "Scanline VRAM":
        if (this.clockCount >= 172) {
          this.clockCount -= 172
          this.renderScanline()
          this.mode = "HBlank"
          if (testBit(this.lcdStatus, 3)) {
            setBit(this.memory.at(0xFF0F), 1) // LCD interrupt flag ON
          }
        }
        break
    }
  }

  renderScanline(): void {
    const scanline = this.gbDoctorHackManualScanline//this.scanlineNumber.read()

    const line = this.bufferContext.createImageData(WIDTH, 1)

    const tileSetBaseAddress = 0x8000 // TODO: different tilesets

    const backgroundPalletByte = this.backgroundPallette.read()
    const pallet: number[][] = [
      COLOURS[(backgroundPalletByte >> 0) & 2],
      COLOURS[(backgroundPalletByte >> 2) & 2],
      COLOURS[(backgroundPalletByte >> 4) & 2],
      COLOURS[(backgroundPalletByte >> 6) & 2],
    ]
    
    // TODO: Optimisation!
    // We're fetching background data from memory for each pixel, we should
    // only fetch it once per tile
    // probably lots of calculations we can pull out of the loop scope as well
    for (let i = 0; i < WIDTH; i++) {

      // Render background
      const backgroundX = (this.scrollX.read() + i) & 0xFF
      const backgroundY = (this.scrollY.read() + scanline) & 0xFF

      const tileMapNumber = (backgroundX >> 3) + (32 * (backgroundY >> 3))
      const tileId = this.memory.at(0x9800 + tileMapNumber).read()
      const row = backgroundY & 0x7
      const rowBaseAddress = tileSetBaseAddress + 16 * tileId + 2 * row
      
      const byte1 = this.memory.at(rowBaseAddress).read()
      const byte2 = this.memory.at(rowBaseAddress + 1).read()
      const tileCol = backgroundX & 0x7
      const bit1 = (byte1 >> (7 - tileCol)) & 1
      const bit2 = (byte2 >> (7 - tileCol)) & 1
      const pixelValue = bit1 + (bit2 << 1)
      const colour = pallet[pixelValue]

      line.data[4 * i + 0] = colour[0]
      line.data[4 * i + 1] = colour[1]
      line.data[4 * i + 2] = colour[2]
      line.data[4 * i + 3] = 255
    }

    // Finally, add the new line to the buffer image
    this.bufferContext.putImageData(line, 0, scanline)    
  }

  renderScreen(): void {
    const screenContext = this.canvas.getContext("2d")!
    screenContext.drawImage(this.buffer, 0, 0)
  }
}