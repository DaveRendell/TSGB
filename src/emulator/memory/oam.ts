import Memory from "../memory"
import { ByteRef } from "../refs/byteRef"
import { LcdControlRegister } from "./registers/lcdRegisters"
import { Sprite } from "./sprite"

const BASE_ADDRESS = 0xFE00

export class OAM {
  sprites: Sprite[] = []

  scanline: ByteRef
  lcdControl: LcdControlRegister

  constructor(memory: Memory) {
    for (let i = 0; i < 40; i++) {
      this.sprites.push(new Sprite(memory))
      this.scanline = memory.registers.scanline
      this.lcdControl = memory.registers.lcdControl
    }
  }

  at(address: number): ByteRef {
    const adjustedAddress = address - BASE_ADDRESS
    const spriteNumber = adjustedAddress >> 2
    const byteNumber = adjustedAddress & 3
    return this.sprites[spriteNumber].bytes[byteNumber]
  }

  spritesAtScanline(): Sprite[] {
    const scanline = this.scanline.value
    const spriteSize = this.lcdControl.objectSize
    return this.sprites
      .filter(sprite => {
        const intersect = sprite.scanlineIntersect(scanline)
        return intersect >= 0 && intersect < spriteSize
      })
      .slice(0, 10)
      .sort((a, b) => a.x - b.x)
  }
}