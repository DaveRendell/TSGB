import BaseScanlineRenderer from "./baseScanlineRenderer";
import { EmulatorMode } from "../emulator";
import { OAM } from "../memory/oam";
import { IoRegisters } from "../memory/registers/ioRegisters";
import { PalletteRegister } from "../memory/registers/lcdRegisters";
import { Sprite } from "../memory/sprite";
import { VRAM } from "../memory/vram";
import { Cartridge } from "../memory/cartridges/cartridge";
import { getPaletteForCartridge } from "./cgbColourisation";
import { PaletteRam } from "../memory/registers/paletteRegisters";


/**
 * Scanline renderer for displaying original DMG games in backwards compatibility mode
 */
export default class DmgColourScanlineRenderer extends BaseScanlineRenderer {
  backgroundPalette: PalletteRegister
  objectPalettes: [PalletteRegister, PalletteRegister]

  palette: PalletteRegister

  backgroundPaletteRam: PaletteRam
  objectPaletteRam: PaletteRam

  bcColours: number[][]

  constructor(registers: IoRegisters, vram: VRAM, oam: OAM, cartridge: Cartridge) {
    super(registers, vram, oam)
    this.mode = EmulatorMode.DMG

    this.backgroundPalette = registers.backgroundPallete
    this.objectPalettes = [registers.objectPallete0, registers.objectPallete1]

    this.backgroundPaletteRam = registers.backgroundPalettes
    this.objectPaletteRam = registers.objectPalettes

    const title = cartridge.title
    const oldLicenseeCode = cartridge.romData[0x014b]
    const newLicenceeCode = String.fromCharCode(...cartridge.romData.slice(0x0144, 0x0146))
    const [bgp, obp0, obp1] = getPaletteForCartridge(title, oldLicenseeCode, newLicenceeCode)
    
    this.setPalettesFromBytes(bgp, obp0, obp1)
  }

  setPalettesFromBytes(bgp: number[], obp0: number[], obp1: number[]): void {
    this.backgroundPaletteRam.autoIncrement = true
    this.objectPaletteRam.autoIncrement = true;
    bgp.forEach(colour => {
      this.backgroundPaletteRam.accessRegister.byte = colour & 0xFF
      this.backgroundPaletteRam.accessRegister.byte = colour >> 8
    });
    ([...obp0, ...obp1]).forEach(colour => {
      this.objectPaletteRam.accessRegister.byte = colour & 0xFF
      this.objectPaletteRam.accessRegister.byte = colour >> 8
    })
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
      ? this.bcColours = this.objectPaletteRam.scaledColours[0]
      : this.bcColours = this.objectPaletteRam.scaledColours[1]
    return sprite.rawPixelAt(scanline, offset, this.lcdControl.objectSize)
  }

  setBackgroundPalette() {
    this.palette = this.backgroundPalette
    this.bcColours = this.backgroundPaletteRam.scaledColours[0]
  }

  setWindowPalette() {
    this.palette = this.backgroundPalette
    this.bcColours = this.backgroundPaletteRam.scaledColours[0]
  }

  useTileColourZero(): number {
    this.palette = this.backgroundPalette
    this.bcColours = this.backgroundPaletteRam.scaledColours[0]
    return 0
  }

  renderPixel(line: ImageData, offset: number, pixel: number): number[] {
    return this.bcColours[this.palette.map[pixel]]
  }
}