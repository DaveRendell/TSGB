import BaseScanlineRenderer from "./baseScanlineRenderer";
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
export default class GbcScanlineRenderer extends BaseScanlineRenderer {
    backgroundPalettes: PaletteRam
  objectPalettes: PaletteRam
  backgroundPaletteId = 0
  windowPaletteId = 0

  paletteId = 0
  paletteType: PaletteType | undefined = undefined
  tileWasWindow = false

  constructor(registers: IoRegisters, vram: VRAM, oam: OAM) {
    super(registers, vram, oam)
    this.mode = EmulatorMode.CGB

    this.backgroundPalettes = registers.backgroundPalettes
    this.objectPalettes = registers.objectPalettes
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

  lineSetUp() {
    this.backgroundPaletteId = 0
    this.windowPaletteId = 0
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
    this.paletteType = PaletteType.Background
  }

  setWindowPalette() {
    this.paletteId = this.windowPaletteId
    this.tileWasWindow = true
    this.paletteType = PaletteType.Background
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
}