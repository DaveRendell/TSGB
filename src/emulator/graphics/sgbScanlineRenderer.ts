import BaseScanlineRenderer from "./baseScanlineRenderer";
import { EmulatorMode } from "../emulator";
import { OAM } from "../memory/oam";
import { IoRegisters } from "../memory/registers/ioRegisters";
import { PalletteRegister } from "../memory/registers/lcdRegisters";
import { Sprite } from "../memory/sprite";
import { VRAM } from "../memory/vram";
import SuperEmulator from "../super/superEmulator";


/**
 * Scanline renderer for displaying Super compatible games
 */
export default class SgbScanlineRenderer extends BaseScanlineRenderer {
  backgroundPalette: PalletteRegister
  objectPalettes: [PalletteRegister, PalletteRegister]

  palette: PalletteRegister

  superEmulator?: SuperEmulator
  
  vramTransferRequested = false
  vramTransferInProgress = false
  vramTransferBuffer: number[] = []

  constructor(registers: IoRegisters, vram: VRAM, oam: OAM, superEmulator: SuperEmulator) {
    super(registers, vram, oam)
    this.mode = EmulatorMode.DMG
    this.superEmulator = superEmulator
    superEmulator.scanlineRenderer = this

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
    if (this.vramTransferInProgress) {
      this.vramTransferBuffer.push(pixel)
    }
    return this.colours[this.palette.map[pixel]]
  }

  override renderScreen(): void {
    if (this.canvas && this.lcdControl.enabled) {
      const screenContext = this.canvas.getContext("2d")!
      screenContext.drawImage(this.buffer, 0, 0)
    }

    if (this.vramTransferInProgress) {
      this.superEmulator.receiveVramTransfer(this.vramTransferBuffer)
      this.vramTransferBuffer = []
      this.vramTransferInProgress = false
    }
    
    if (this.vramTransferRequested) {
      this.vramTransferRequested = false
      this.vramTransferInProgress = true
    }
  }
}