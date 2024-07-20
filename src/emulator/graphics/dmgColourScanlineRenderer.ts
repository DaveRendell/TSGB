import BaseScanlineRenderer from "./baseScanlineRenderer";
import { EmulatorMode } from "../emulator";
import { OAM } from "../memory/oam";
import { IoRegisters } from "../memory/registers/ioRegisters";
import { PalletteRegister } from "../memory/registers/lcdRegisters";
import { Sprite } from "../memory/sprite";
import { VRAM } from "../memory/vram";


/**
 * Scanline renderer for displaying original DMG games in backwards compatibility mode
 */
export default class DmgColourScanlineRenderer extends BaseScanlineRenderer {
  backgroundPalette: PalletteRegister
  objectPalettes: [PalletteRegister, PalletteRegister]

  palette: PalletteRegister

  backgroundColours = [
    [0xFF, 0xFF, 0xFF],
    [0xFF, 0x84, 0x84],
    [0x94, 0x3A, 0x3A],
    [0x00, 0x00, 0x00],
  ]

  object0Colours = [
    [0xFF, 0xFF, 0xFF],
    [0x7B, 0xFF, 0x31],
    [0x00, 0x84, 0x00],
    [0x00, 0x00, 0x00],
  ]

  object1Colours = [
    [0xFF, 0xFF, 0xFF],
    [0xFF, 0x84, 0x84],
    [0x94, 0x3A, 0x3A],
    [0x00, 0x00, 0x00],
  ]

  bcColours = this.backgroundColours

  constructor(registers: IoRegisters, vram: VRAM, oam: OAM) {
    super(registers, vram, oam)
    this.mode = EmulatorMode.DMG

    this.backgroundPalette = registers.backgroundPallete
    this.objectPalettes = [registers.objectPallete0, registers.objectPallete1]
  }

  getBackgroundTileRow = (offset: number, backgroundY: number): number[] => {
    const backgroundX = (this.scrollX.byte + offset) & 0xff
    const tileMapNumber = (backgroundX >> 3) + ((backgroundY >> 3) << 5)
    const tileId = this.vram.tilemap(this.lcdControl.backgroundTilemap, tileMapNumber)
    const row = backgroundY & 0x7
    return this.vram.tileset(
      this.lcdControl.tileDataArea,
      tileId,
      0,
      false,
      false,
      row
    )
  }

  getWindowTileRow = (offset: number): number[] => {
    const tileMapNumber = (offset >> 3) + ((this.windowLine.byte >> 3) << 5)
    const tileId = this.vram.tilemap(this.lcdControl.windowTilemap, tileMapNumber)
    const row = this.windowLine.byte & 0x7
    return this.vram.tileset(
      this.lcdControl.tileDataArea,
      tileId,
      0,
      false,
      false,
      row
    )
  }

  lineSetUp() {
  }

  pixelSetUp() {
  }

  setPixelFromSprite(sprite: Sprite, scanline: number, offset: number): number {
    this.palette = this.objectPalettes[sprite.monochromePalette]
    sprite.monochromePalette === 0
      ? this.bcColours = this.object0Colours
      : this.bcColours = this.object1Colours
    return sprite.rawPixelAt(scanline, offset, this.lcdControl.objectSize)
  }

  setBackgroundPalette() {
    this.palette = this.backgroundPalette
    this.bcColours = this.backgroundColours
  }

  setWindowPalette() {
    this.palette = this.backgroundPalette
    this.bcColours = this.backgroundColours
  }

  useTileColourZero(): number {
    this.palette = this.backgroundPalette
    this.bcColours = this.backgroundColours
    return 0
  }

  renderPixel(line: ImageData, offset: number, pixel: number): number[] {
    return this.bcColours[this.palette.map[pixel]]
  }
}