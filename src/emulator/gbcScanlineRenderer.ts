import { OAM } from "./memory/oam";
import { IoRegisters } from "./memory/registers/ioRegisters";
import { LcdControlRegister, LcdStatusRegister, PalletteRegister } from "./memory/registers/lcdRegisters";
import { PaletteRam } from "./memory/registers/paletteRegisters";
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

  constructor(registers: IoRegisters, vram: VRAM, oam: OAM) {
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

  renderScanline(): void {
    if (!this.lcdControl.enabled) {
      return
    }

    const scanline = this.scanlineNumber.byte

    const line = this.bufferContext.createImageData(WIDTH, 1)

    const scrollX = this.scrollX.byte
    const scrollY = this.scrollY.byte
    const backgroundY = (scrollY + scanline) & 0xff

    let backgroundPaletteId = 0

    // Returns the 8 long row of the background tile at pixel offset given
    const getBackgroundTileRow = (offset: number): number[] => {
      const backgroundX = (scrollX + offset) & 0xff
      const tileMapNumber = (backgroundX >> 3) + ((backgroundY >> 3) << 5)
      const attributes = this.lcdControl.backgroundTilemap == 0
        ? this.vram.tileAttributes0[tileMapNumber]
        : this.vram.tileAttributes1[tileMapNumber]
      backgroundPaletteId = attributes.palette
      const tileId =
        this.lcdControl.backgroundTilemap == 0
          ? this.vram.tilemap0(tileMapNumber)
          : this.vram.tilemap1(tileMapNumber)
      const row = backgroundY & 0x7
      return this.lcdControl.tileDataArea == 1
        ? this.vram.tileset0(tileId, row, attributes.bank)
        : this.vram.tileset1(tileId, row, attributes.bank)
    }

    const winY = scanline - this.windowY.byte

    let windowPaletteId = 0

    // Returns the 8 long row of the background tile at pixel offset given
    const getWindowTileRow = (offset: number): number[] => {
      const tileMapNumber = (offset >> 3) + ((this.windowLine >> 3) << 5)
      const attributes = this.lcdControl.windowTilemap == 0
        ? this.vram.tileAttributes0[tileMapNumber]
        : this.vram.tileAttributes1[tileMapNumber]
      windowPaletteId = attributes.palette
      const tileId =
        this.lcdControl.windowTilemap == 0
          ? this.vram.tilemap0(tileMapNumber)
          : this.vram.tilemap1(tileMapNumber)
      const row = this.windowLine & 0x7
      return this.lcdControl.tileDataArea == 1
        ? this.vram.tileset0(tileId, row, attributes.bank)
        : this.vram.tileset1(tileId, row, attributes.bank)
    }

    let backgroundTileRow = getBackgroundTileRow(0)
    let backgroundTileCounter = scrollX & 0x7

    let windowTileRow = getWindowTileRow(0)
    let windowTileCounter = 0

    const sprites = this.oam.spritesAtScanline()
    const highPrioritySprites = sprites.filter((s) => !s.priority)
    const lowPrioritySprites = sprites.filter((s) => s.priority)

    for (let i = 0; i < WIDTH; i++) {
      if (!this.lcdControl.enabled) {
        return
      }
      let pixel: number | undefined
      let paletteType: PaletteType | undefined
      let paletteId = 0


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
          pixel = sprite.rawPixelAt(scanline, i, this.lcdControl.objectSize)
          paletteType = PaletteType.Object
          paletteId = sprite.colourPalette
        }
      }

      let tilePixel: number | undefined = undefined

      // Render window
      const winX = i - (this.windowX.byte - 7)
      if (pixel === undefined && this.lcdControl.windowEnabled) {
        if (winY >= 0 && winX >= 0) {
          tilePixel = windowTileRow[winX % 8]
          paletteId = windowPaletteId
        }
      }
      if (winX >= 0 && winY >= 0) {
        windowTileCounter++
        if (windowTileCounter === 8) {
          windowTileCounter = 0
          windowTileRow = getWindowTileRow(winX + 1)
        }
      }

      // Render background (excluding the lowest colour in the pallete)
      if (
        pixel === undefined &&
        tilePixel === undefined &&
        this.lcdControl.backgroundWindowDisplay
      ) {
        tilePixel = backgroundTileRow[(scrollX + i) % 8]
        paletteId = backgroundPaletteId
      }

      // Get next background tile if needed
      backgroundTileCounter++
      if (backgroundTileCounter === 8) {
        backgroundTileCounter = 0
        backgroundTileRow = getBackgroundTileRow(i + 1)
      }

      if (tilePixel !== undefined) {
        pixel = tilePixel
        paletteType = PaletteType.Background
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
          pixel = sprite.rawPixelAt(scanline, i, this.lcdControl.objectSize)
          paletteType = PaletteType.Object
          paletteId = sprite.colourPalette
        }
      }

      // If nothing else has rendered, use the lowest colour in the pallete
      if (pixel === undefined) {
        pixel = 0
        paletteType = PaletteType.Background
        paletteId = backgroundPaletteId
      }

      const palette = paletteType === PaletteType.Background
        ? this.backgroundPalettes.scaledColours[paletteId]
        : this.objectPalettes.scaledColours[paletteId]
      const colour = palette[pixel]
      line.data[4 * i + 0] = colour[0]
      line.data[4 * i + 1] = colour[1]
      line.data[4 * i + 2] = colour[2]
      line.data[4 * i + 3] = 255
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