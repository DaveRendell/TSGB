import { MutableValue } from "../types";
import { increment } from "./arithmetic";
import CPU from "./cpu";
import { resetBit, setBit, testBit } from "./instructions/instructionHelpers";
import Memory from "./memory";
import { Interrupt } from "./memory/registers/interruptRegisters";
import { LcdControlRegister, LcdStatusRegister } from "./memory/registers/lcdRegisters";
import { ByteRef } from "./refs/byteRef";

const WIDTH = 160
const HEIGHT = 144
const SCANLINES = 154

const COLOURS = [
  [255, 255, 255],
  [192, 192, 192],
  [96, 96, 96],
  [0, 0, 0],
]

const SPRITE_MEMORY_START = 0xFE00
const TILESET_MEMORY_START = 0x8000
const BACKGROUND_MEMORY_START = 0x9800

type Mode = "HBlank" | "VBlank" | "Scanline OAM" | "Scanline VRAM"

interface SpriteRow {
  row: (number[] | undefined)[]
  x: number
}

export default class Screen {
  cpu: CPU
  memory: Memory
  canvas: HTMLCanvasElement
  buffer: OffscreenCanvas
  bufferContext: OffscreenCanvasRenderingContext2D

  lcdControl: LcdControlRegister
  lcdStatus: LcdStatusRegister
  scrollX: ByteRef
  scrollY: ByteRef
  scanlineNumber: ByteRef
  backgroundPallette: ByteRef
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

    this.lcdControl = this.memory.registers.lcdControl
    this.lcdStatus = this.memory.registers.lcdStatus
    this.scrollY = this.memory.registers.scrollY
    this.scrollX = this.memory.registers.scrollX
    this.scanlineNumber = this.memory.registers.scanline
    this.backgroundPallette = this.memory.registers.backgroundPallete

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
          this.scanlineNumber.value++
          this.gbDoctorHackManualScanline++
          if (this.gbDoctorHackManualScanline === HEIGHT) {
            this.renderScreen()
            this.memory.registers.interrupts.setInterrupt(Interrupt.VBlank)
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
          this.scanlineNumber.value++
          this.gbDoctorHackManualScanline++
          if (this.gbDoctorHackManualScanline >= SCANLINES) {
            this.scanlineNumber.value = 0
            this.gbDoctorHackManualScanline = 0
            this.renderScanline()
            this.mode = "HBlank"
            this.lcdStatus.mode0InterruptEnabled
            if (this.lcdStatus.mode0InterruptEnabled) {
              this.memory.registers.interrupts.setInterrupt(Interrupt.LCD)
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
          if (this.lcdStatus.mode0InterruptEnabled) {
            this.memory.registers.interrupts.setInterrupt(Interrupt.LCD)
          }
        }
        break
    }
  }

  renderScanline(): void {
    const scanline = this.gbDoctorHackManualScanline//this.scanlineNumber.read()

    const line = this.bufferContext.createImageData(WIDTH, 1)

    const backgroundPalletByte = this.backgroundPallette.value
    const backgroundPallet: number[][] = [
      COLOURS[(backgroundPalletByte >> 0) & 3],
      COLOURS[(backgroundPalletByte >> 2) & 3],
      COLOURS[(backgroundPalletByte >> 4) & 3],
      COLOURS[(backgroundPalletByte >> 6) & 3],
    ]

    const scrollX = this.scrollX.value
    const scrollY = this.scrollY.value
    const backgroundY = (scrollY + scanline) & 0xFF

    // Returns the 8 long row of the background tile at pixel offset given
    const getBackgroundTileRow = (offset: number): number[][] => {
      const backgroundX = (scrollX + offset) & 0xFF
      const tileMapNumber = (backgroundX >> 3) + (32 * (backgroundY >> 3))
      const tileId = this.memory.at(BACKGROUND_MEMORY_START + tileMapNumber).value
      const row = backgroundY & 0x7
      const rowBaseAddress = TILESET_MEMORY_START + 16 * tileId + 2 * row
      const byte1 = this.memory.at(rowBaseAddress).value
      const byte2 = this.memory.at(rowBaseAddress + 1).value
      let pixels: number[][] = []
      for (let i = 0; i < 8; i++) {
        const bit1 = (byte1 >> (7 - i)) & 1
        const bit2 = (byte2 >> (7 - i)) & 1
        const pixelValue = bit1 + 2 * bit2
        pixels.push(backgroundPallet[pixelValue])
      }
      return pixels
    }

    // Find which sprites overlap, grab relevant row of tile
    // TODO: handle sprite priority
    // TODO: Fix... buginess?
    const spriteSize = this.lcdControl.objectSize
    const spriteRows: SpriteRow[] = []
    for (let i = 0; i < 40; i++) {
      const spriteBaseAddress = SPRITE_MEMORY_START + 4 * i
      const spriteY = this.memory.at(spriteBaseAddress + 0).value
      const palleteAddress = 0xFF48 // TODO multiple palletes
      const palletByte = this.memory.at(palleteAddress).value
      const pallet: number[][] = [
        COLOURS[(palletByte >> 0) & 3],
        COLOURS[(palletByte >> 2) & 3],
        COLOURS[(palletByte >> 4) & 3],
        COLOURS[(palletByte >> 6) & 3],
      ]

      // TODO flip X and Y
      const spriteRow = spriteY - 9 - scanline
      if (spriteRow > 0 && spriteRow <= spriteSize) {
        let tileId = this.memory.at(spriteBaseAddress + 2).value
        if (spriteSize === 16) {
          tileId = spriteRow > 8 ? tileId | 1 : tileId & 0xFE
        }
        const rowBaseAddress = TILESET_MEMORY_START + 16 * tileId + 2 * (spriteRow % 8)
        const byte1 = this.memory.at(rowBaseAddress).value
        const byte2 = this.memory.at(rowBaseAddress + 1).value
        let pixels: (number[] | undefined)[] = []
        for (let i = 0; i < 8; i++) {
          const bit1 = (byte1 >> (7 - i)) & 1
          const bit2 = (byte2 >> (7 - i)) & 1
          const pixelValue = bit1 + 2 * bit2
          pixels.push(pixelValue == 0 ? undefined : pallet[pixelValue])
        }
        spriteRows.push({
          x: this.memory.at(spriteBaseAddress + 1).value,
          row: pixels
        })
      }
    }

    let backgroundTileRow = getBackgroundTileRow(0)
    let backgroundTileCounter = scrollX & 0x7
    
    for (let i = 0; i < WIDTH; i++) {
      let pixel: number[] | undefined

      // Render sprites
      const sprite = spriteRows
        .find(({x}) => i < x && i >= x - 8)
      if (sprite) {
        pixel = sprite.row[8 - (sprite.x - i)]
      }

      // Render background
      if (!pixel) {
        pixel = backgroundTileRow[(scrollX + i) % 8]
        
        
      }
      backgroundTileCounter++
      if (backgroundTileCounter === 8) {
        backgroundTileCounter = 0
        backgroundTileRow = getBackgroundTileRow(i + 1)
      }

      line.data[4 * i + 0] = pixel[0]
      line.data[4 * i + 1] = pixel[1]
      line.data[4 * i + 2] = pixel[2]
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