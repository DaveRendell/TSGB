import BaseScanlineRenderer from "./baseScanlineRenderer";
import { EmulatorMode } from "../emulator";
import { OAM } from "../memory/oam";
import { IoRegisters } from "../memory/registers/ioRegisters";
import { PalletteRegister } from "../memory/registers/lcdRegisters";
import { Sprite } from "../memory/sprite";
import { VRAM } from "../memory/vram";
import SuperEmulator from "../super/superEmulator";
import { MaskMode } from "../super/commands/maskEnable";


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

  maskMode: MaskMode = "UNMASK"

  borderEnabled: boolean
  borderRedrawNeeded = true

  screenX: number
  screenY: number

  constructor(registers: IoRegisters, vram: VRAM, oam: OAM, superEmulator: SuperEmulator, borderEnabled: boolean) {
    super(registers, vram, oam)
    this.mode = EmulatorMode.DMG
    this.superEmulator = superEmulator
    superEmulator.scanlineRenderer = this

    this.backgroundPalette = registers.backgroundPallete
    this.objectPalettes = [registers.objectPallete0, registers.objectPallete1]
    this.borderEnabled = borderEnabled
    this.screenX = borderEnabled ? 6 * 8 : 0
    this.screenY = borderEnabled ? 5 * 8 : 0
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
    const paletteId = this.superEmulator.attributes.data
      [this.scanlineNumber.byte >> 3]
      [offset >> 3]
    const colour = this.superEmulator.palettes[paletteId].colours
    return colour[this.palette.map[pixel]]
  }

  override renderScreen(): void {
    if (this.canvas && this.lcdControl.enabled) {
      const screenContext = this.canvas.getContext("2d")!
      if (this.maskMode === "UNMASK") {
        screenContext.drawImage(this.buffer, this.screenX, this.screenY)
      }
      if (this.maskMode === "BLACK") {
        screenContext.fillStyle = "black"
        screenContext.fillRect(this.screenX, this.screenY, 160, 144)
      }
      if (this.maskMode === "BLANK") {
        screenContext.fillStyle = "white" // actually colour 0?
        screenContext.fillRect(this.screenX, this.screenY, 160, 144)
      }

      if (this.borderEnabled && this.borderRedrawNeeded) {
        this.superEmulator.drawBorder(this.canvas)
        this.borderRedrawNeeded = false
      }
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