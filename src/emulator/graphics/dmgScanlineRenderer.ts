import BaseScanlineRenderer from "./baseScanlineRenderer";
import { EmulatorMode } from "../emulator";
import { OAM } from "../memory/oam";
import { IoRegisters } from "../memory/registers/ioRegisters";
import { PalletteRegister } from "../memory/registers/lcdRegisters";
import { Sprite } from "../memory/sprite";
import { VRAM } from "../memory/vram";


/**
 * Scanline renderer for displaying 4 tone monochrome games
 */
export default class DmgScanlineRenderer extends BaseScanlineRenderer {
  backgroundPalette: PalletteRegister
  objectPalettes: [PalletteRegister, PalletteRegister]

  palette: PalletteRegister

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
    const tileMapNumber = (offset >> 3) + ((this.windowLine >> 3) << 5)
    const tileId = this.vram.tilemap(this.lcdControl.windowTilemap, tileMapNumber)
    const row = this.windowLine & 0x7
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
    return sprite.rawPixelAt(scanline, offset, this.lcdControl.objectSize)
  }

  setBackgroundPalette() {
    this.palette = this.backgroundPalette
  }

  setWindowPalette() {
    this.palette = this.backgroundPalette
  }

  useTileColourZero(): number {
    this.palette = this.backgroundPalette
    return 0
  }

  renderPixel(line: ImageData, offset: number, pixel: number): number[] {
    return this.colours[this.palette.map[pixel]]
  }
}