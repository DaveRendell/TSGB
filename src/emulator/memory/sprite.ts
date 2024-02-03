import { WorkerRegisters } from "../graphics/workerRegisters"
import { ByteRef, GetSetByteRef } from "../refs/byteRef"
import { IoRegisters } from "./registers/ioRegisters"
import { PalletteRegister } from "./registers/lcdRegisters"
import { VRAM } from "./vram"

// Reference: https://gbdev.io/pandocs/OAM.html#object-attribute-memory-oam
export class Sprite {
  data: Uint8Array

  pallette0: PalletteRegister
  pallette1: PalletteRegister
  vram: VRAM

  constructor(data: Uint8Array, vram: VRAM, registers: IoRegisters | WorkerRegisters) {
    this.data = data   
    this.pallette0 = registers.objectPallete0
    this.pallette1 = registers.objectPallete1
    this.vram = vram
  }

  y() { return this.data[0] }
  x() { return this.data[1] }
  tile() { return this.data[2] }
  priority() { return (this.data[3] & 0x80) > 0 }
  flipY() { return (this.data[3] & 0x40) > 0 }
  flipX() { return (this.data[3] & 0x20) > 0 }
  monochromePallete() { return this.data[3] & 0x10 }

  scanlineIntersect(scanline: number): number {
    return scanline - (this.y() - 16)
  }

  pixelAt(
    scanline: number,
    column: number,
    spriteSize: number,
  ): number | undefined {
    const row = this.flipY()
      ? spriteSize - 1 - this.scanlineIntersect(scanline)
      : this.scanlineIntersect(scanline)

    const tileId =
      spriteSize == 16
        ? row >= 8
          ? this.tile() | 1
          : this.tile() & 0xfe
        : this.tile()

    const x = this.flipX() ? 7 - (column - (this.x() - 8)) : column - (this.x() - 8)
    const tileValue = this.vram.tileset0(tileId, row % 8)[x]
    if (tileValue == 0) return undefined // Transparent pixel
    return this.monochromePallete() == 0
      ? this.pallette0.map[tileValue]
      : this.pallette1.map[tileValue]
  }
}
