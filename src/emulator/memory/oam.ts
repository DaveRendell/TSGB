import { ByteRef } from "../refs/byteRef"
import { IoRegisters } from "./registers/ioRegisters"
import { LcdControlRegister } from "./registers/lcdRegisters"
import { Sprite } from "./sprite"
import { VRAM } from "./vram"

const BASE_ADDRESS = 0xfe00

export class OAM {
  sprites: Sprite[] = []

  scanline: ByteRef
  lcdControl: LcdControlRegister

  constructor(registers: IoRegisters, vram: VRAM) {
    for (let i = 0; i < 40; i++) {
      this.sprites.push(new Sprite(vram, registers))
      this.scanline = registers.scanline
      this.lcdControl = registers.lcdControl
    }
  }

  at(address: number): ByteRef {
    const adjustedAddress = address - BASE_ADDRESS
    const spriteNumber = adjustedAddress >> 2
    const byteNumber = adjustedAddress & 3
    return this.sprites[spriteNumber].bytes[byteNumber]
  }

  spritesAtScanline(): Sprite[] {
    const scanline = this.scanline.byte
    const spriteSize = this.lcdControl.objectSize
    return this.sprites
      .filter((sprite) => {
        const intersect = sprite.scanlineIntersect(scanline)
        return intersect >= 0 && intersect < spriteSize
      })
      .slice(0, 10)
      .sort((a, b) => a.x - b.x)
  }
}
