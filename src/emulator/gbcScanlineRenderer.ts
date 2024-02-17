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
export default class GbcScanlineRenderer implements ScanlineRenderer {
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
  backgroundPallette: PalletteRegister
  windowLine = 0

  backgroundPalettes: PaletteRam
  objectPalettes: PaletteRam

  colours = [
    [255, 255, 255],
    [192, 192, 192],
    [96, 96, 96],
    [0, 0, 0],
  ]

  backgroundPaletteId = 0
  backgroundTileRow: number[] = []
  backgroundTileCounter = 0

  windowPaletteId = 0
  windowTileRow: number[] = []
  windowTileCounter = 0

  paletteId = 0
  paletteType: PaletteType | undefined = undefined
  tileWasWindow = false

  constructor(registers: IoRegisters, vram: VRAM, oam: OAM) {
    this.mode = EmulatorMode.CGB
    this.vram = vram
    this.oam = oam

    this.lcdControl = registers.lcdControl
    this.scrollY = registers.scrollY
    this.scrollX = registers.scrollX
    this.windowX = registers.windowX
    this.windowY = registers.windowY
    this.scanlineNumber = registers.scanline

    this.backgroundPalettes = registers.backgroundPalettes
    this.objectPalettes = registers.objectPalettes

    this.buffer = new OffscreenCanvas(WIDTH, HEIGHT)
    this.bufferContext = this.buffer.getContext("2d")!
  }

  getBackgroundTileRow = (offset: number, backgroundY: number): number[] => {
    const backgroundX = (this.scrollX.byte + offset) & 0xff
    const tileMapNumber = (backgroundX >> 3) + ((backgroundY >> 3) << 5)
    const attributes = 
      this.vram.tileAttributes[(this.lcdControl.backgroundTilemap << 10) + tileMapNumber]
      this.backgroundPaletteId = attributes.palette
    const tileId =
      this.lcdControl.backgroundTilemap == 0
        ? this.vram.tilemap0(tileMapNumber)
        : this.vram.tilemap1(tileMapNumber)
    const row = backgroundY & 0x7
    return this.vram.tileset(
      this.lcdControl.tileDataArea,
      tileId,
      attributes.bank,
      attributes.xFlip,
      attributes.yFlip,
      row
    )
  }

  getWindowTileRow = (offset: number): number[] => {
    const tileMapNumber = (offset >> 3) + ((this.windowLine >> 3) << 5)
    const attributes =
      this.vram.tileAttributes[(this.lcdControl.windowTilemap << 10) + tileMapNumber]
    this.windowPaletteId = attributes.palette
    const tileId =
      this.lcdControl.windowTilemap == 0
        ? this.vram.tilemap0(tileMapNumber)
        : this.vram.tilemap1(tileMapNumber)
    const row = this.windowLine & 0x7
    return this.vram.tileset(
      this.lcdControl.tileDataArea,
      tileId,
      attributes.bank,
      attributes.xFlip,
      attributes.yFlip,
      row
    )
  }

  pixelSetUp() {
    this.paletteType = undefined
    this.paletteId = 0
    this.tileWasWindow = false
  }

  setPixelFromSprite(sprite: Sprite, scanline: number, offset: number): number {
    this.paletteType = PaletteType.Object
    this.paletteId = sprite.colourPalette
    return sprite.rawPixelAt(scanline, offset, this.lcdControl.objectSize)
  }

  setBackgroundPalette() {
    this.paletteId = this.backgroundPaletteId
  }

  setWindowPalette() {
    this.paletteId = this.windowPaletteId
    this.tileWasWindow = true
  }

  useTileColourZero(): number {
    this.paletteType = PaletteType.Background
    this.paletteId = this.tileWasWindow ? this.windowPaletteId : this.backgroundPaletteId
    return 0
  }

  renderPixel(line: ImageData, offset: number, pixel: number) {
    const palette = this.paletteType === PaletteType.Background
        ? this.backgroundPalettes.scaledColours[this.paletteId]
        : this.objectPalettes.scaledColours[this.paletteId]
    const colour = palette[pixel]
    line.data[4 * offset + 0] = colour[0]
    line.data[4 * offset + 1] = colour[1]
    line.data[4 * offset + 2] = colour[2]
    line.data[4 * offset + 3] = 255
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

    this.backgroundPaletteId = 0

    const winY = scanline - this.windowY.byte

    this.windowPaletteId = 0

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
        this.paletteType = PaletteType.Background
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