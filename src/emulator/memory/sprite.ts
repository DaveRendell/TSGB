import Memory from "./memoryMap"
import { ByteRef, GetSetByteRef } from "../refs/byteRef"
import { PalletteRegister } from "./registers/lcdRegisters"
import { VRAM } from "./vram"

// Reference: https://gbdev.io/pandocs/OAM.html#object-attribute-memory-oam
export class Sprite {
  x = 0
  y = 0
  tile = 0
  priority = false
  flipY = false
  flipX = false
  monochromePalette = 0
  colourPalette = 0

  bytes: ByteRef[]

  pallette0: PalletteRegister
  pallette1: PalletteRegister
  vram: VRAM

  constructor(memory: Memory) {
    const bytes: ByteRef[] = []
    bytes.push(
      new GetSetByteRef( // 0: Y Position
        () => this.y,
        (value) => (this.y = value),
      ),
    )
    bytes.push(
      new GetSetByteRef( // 1: X Position
        () => this.x,
        (value) => (this.x = value),
      ),
    )
    bytes.push(
      new GetSetByteRef( // 2: Tile index
        () => this.tile,
        (value) => (this.tile = value),
      ),
    )
    bytes.push(
      new GetSetByteRef( // 3: Attributes / Flags
        () =>
          (this.priority ? 0x80 : 0) +
          (this.flipY ? 0x40 : 0) +
          (this.flipX ? 0x20 : 0) +
          (this.monochromePalette << 4) +
          this.colourPalette,
        (value) => {
          this.priority = (value & 0x80) > 0
          this.flipY = (value & 0x40) > 0
          this.flipX = (value & 0x20) > 0
          this.monochromePalette = (value & 0x10) >> 4
          this.colourPalette = value & 0x7
        },
      ),
    )
    this.bytes = bytes
    this.pallette0 = memory.registers.objectPallete0
    this.pallette1 = memory.registers.objectPallete1
    this.vram = memory.vram
  }

  scanlineIntersect(scanline: number): number {
    return scanline - (this.y - 16)
  }
  
  rawPixelAt(
    scanline: number,
    column: number,
    spriteSize: number,
  ): number | undefined {
    const row = this.flipY
      ? spriteSize - 1 - this.scanlineIntersect(scanline)
      : this.scanlineIntersect(scanline)

    const tileId =
      spriteSize == 16
        ? row >= 8
          ? this.tile | 1
          : this.tile & 0xfe
        : this.tile

    const x = this.flipX ? 7 - (column - (this.x - 8)) : column - (this.x - 8)
    const tileValue = this.vram.tileset0(tileId, row % 8)[x]
    if (tileValue == 0) return undefined // Transparent pixel
    return tileValue
  }
}
