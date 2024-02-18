import { EmulatorMode } from "./emulator";
import { OAM } from "./memory/oam";
import { IoRegisters } from "./memory/registers/ioRegisters";
import { LcdControlRegister, LcdStatusRegister, PalletteRegister } from "./memory/registers/lcdRegisters";
import { PaletteRam } from "./memory/registers/paletteRegisters";
import { Sprite } from "./memory/sprite";
import { VRAM } from "./memory/vram";
import { ByteRef } from "./refs/byteRef";
import ScanlineRenderer from "./scanlineRenderer";

const WIDTH = 160
const HEIGHT = 144

enum PaletteType {
  Background,
  Object
}

/**
 * Scanline renderer for displaying game swith colour palettes.
 */
export default class BaseScanlineRenderer implements ScanlineRenderer {
  mode: EmulatorMode
  canvas?: HTMLCanvasElement = undefined
  buffer: OffscreenCanvas
  bufferContext: OffscreenCanvasRenderingContext2D

  vram: VRAM
  oam: OAM

  lcdControl: LcdControlRegister
  scrollX: ByteRef
  scrollY: ByteRef
  windowX: ByteRef
  windowY: ByteRef
  scanlineNumber: ByteRef
  windowLine = 0

  colours = [
    [255, 255, 255],
    [192, 192, 192],
    [96, 96, 96],
    [0, 0, 0],
  ]

  backgroundTileRow: number[] = []
  backgroundTileCounter = 0

  windowTileRow: number[] = []
  windowTileCounter = 0

  constructor(registers: IoRegisters, vram: VRAM, oam: OAM) {
    this.vram = vram
    this.oam = oam

    this.lcdControl = registers.lcdControl
    this.scrollY = registers.scrollY
    this.scrollX = registers.scrollX
    this.windowX = registers.windowX
    this.windowY = registers.windowY
    this.scanlineNumber = registers.scanline

    this.buffer = new OffscreenCanvas(WIDTH, HEIGHT)
    this.bufferContext = this.buffer.getContext("2d")!
  }

  getBackgroundTileRow = (offset: number, backgroundY: number): number[] => {
    throw new Error("Method not implemented")
  }

  getWindowTileRow = (offset: number): number[] => {
    throw new Error("Method not implemented")
  }

  lineSetUp() {
    throw new Error("Method not implemented")
  }

  pixelSetUp() {
    throw new Error("Method not implemented")
  }

  setPixelFromSprite(sprite: Sprite, scanline: number, offset: number): number {
    throw new Error("Method not implemented")
  }

  setBackgroundPalette() {
    throw new Error("Method not implemented")
  }

  setWindowPalette() {
    throw new Error("Method not implemented")
  }

  useTileColourZero(): number {
    throw new Error("Method not implemented")
  }

  renderPixel(line: ImageData, offset: number, pixel: number) {
    throw new Error("Method not implemented")
  }

  renderScanline(): void {
    if (!this.lcdControl.enabled) {
      return
    }

    const scanline = this.scanlineNumber.byte

    const line = this.bufferContext.createImageData(WIDTH, 1)

    const scrollX = this.scrollX.byte
    const scrollY = this.scrollY.byte
    const backgroundY = (scrollY + scanline) & 0xff

    const winY = scanline - this.windowY.byte

    this.backgroundTileRow = this.getBackgroundTileRow(0, backgroundY)
    this.backgroundTileCounter = scrollX & 0x7

    this.windowTileRow = this.getWindowTileRow(0)
    this.windowTileCounter = 0

    const sprites = this.oam.spritesAtScanline(this.mode)
    const highPrioritySprites = sprites.filter((s) => !s.priority)
    const lowPrioritySprites = sprites.filter((s) => s.priority)

    for (let i = 0; i < WIDTH; i++) {
      if (!this.lcdControl.enabled) {
        return
      }
      let pixel: number | undefined
      this.pixelSetUp()


      // Render high priority sprites (that go above background)
      if (pixel === undefined && this.lcdControl.objectsEnabled) {
        const sprite = highPrioritySprites.find(
          (sprite) =>
            i - (sprite.x - 8) >= 0 &&
            i - (sprite.x - 8) < 8 &&
            sprite.rawPixelAt(scanline, i, this.lcdControl.objectSize) !=
              undefined,
        )
        if (sprite) {
          pixel = this.setPixelFromSprite(sprite, scanline, i)
        }
      }

      let tilePixel: number | undefined = undefined

      // Render window
      const winX = i - (this.windowX.byte - 7)
      if (winX >= 0 && winY >= 0) {
        if (this.windowTileCounter === 8) {
          this.windowTileCounter = 0
          this.windowTileRow = this.getWindowTileRow(winX)
        }
        if (pixel === undefined && this.lcdControl.windowEnabled) {
          tilePixel = this.windowTileRow[winX % 8]
          this.setWindowPalette()
        }
        this.windowTileCounter++
      }

      // Render background (excluding the lowest colour in the pallete)
      if (this.backgroundTileCounter === 8) {
        this.backgroundTileCounter = 0
        this.backgroundTileRow = this.getBackgroundTileRow(i, backgroundY)
      }
      if (
        pixel === undefined &&
        tilePixel === undefined &&
        this.lcdControl.backgroundWindowDisplay
      ) {
        tilePixel = this.backgroundTileRow[(scrollX + i) % 8]
        this.setBackgroundPalette()
      }
      this.backgroundTileCounter++
      

      if (tilePixel !== undefined && tilePixel !== 0) {
        pixel = tilePixel
      }

      // Render low priority sprites (that go below non zero background)
      if (pixel === undefined && this.lcdControl.objectsEnabled) {
        const sprite = lowPrioritySprites.find(
          (sprite) =>
            i - (sprite.x - 8) >= 0 &&
            i - (sprite.x - 8) < 8 &&
            sprite.rawPixelAt(scanline, i, this.lcdControl.objectSize) !=
              undefined,
        )
        if (sprite) {
          pixel = this.setPixelFromSprite(sprite, scanline, i)
        }
      }

      // If nothing else has rendered, use the lowest colour in the pallete
      if (pixel === undefined) {
        pixel = this.useTileColourZero()
      }

      this.renderPixel(line, i, pixel)
    }

    // Finally, add the new line to the buffer image
    this.bufferContext.putImageData(line, 0, scanline)
  }

  renderScreen(): void {
    if (this.canvas && this.lcdControl.enabled) {
      const screenContext = this.canvas.getContext("2d")!
      screenContext.drawImage(this.buffer, 0, 0)
    }
  }
}