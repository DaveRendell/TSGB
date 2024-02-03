import { WorkerRegisters } from "../graphics/workerRegisters"
import { ByteRef, GetSetByteRef } from "../refs/byteRef"
import { IoRegisters } from "./registers/ioRegisters"
import { LcdControlRegister } from "./registers/lcdRegisters"
import { Sprite } from "./sprite"
import { VRAM } from "./vram"

const BASE_ADDRESS = 0xfe00

export class OAM {
  data: Uint8Array

  scanline: ByteRef
  lcdControl: LcdControlRegister
  vram: VRAM
  registers: IoRegisters | WorkerRegisters

  constructor(registers: IoRegisters | WorkerRegisters, vram: VRAM, buffer: SharedArrayBuffer) {
    this.data = new Uint8Array(buffer)
    this.vram = vram
    this.registers = registers
    this.scanline = registers.scanline
    this.lcdControl = registers.lcdControl
  }

  spritesAtScanline(): Sprite[] {
    const scanline = this.scanline.byte
    const spriteSize = this.lcdControl.objectSize
    let spriteIds: number[] = []
    for (let id = 0; id < 40; id++) {
      const spriteY = this.data[4 * id]
      const intersect = scanline - (spriteY - 16)
      if (intersect >= 0 && intersect < spriteSize) {
        spriteIds.push(id)
      }
    }
    return spriteIds
      .slice(0, 10)
      .sort((a, b) => this.data[4 * a + 1] - this.data[4 * b + 1])
      .map(id => new Sprite(this.data.slice(4 * id, 4 * (id + 1)), this.vram, this.registers))
  }
}
