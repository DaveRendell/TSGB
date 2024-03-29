import { ByteRef } from "../../refs/byteRef"

// Reference: https://gbdev.io/pandocs/LCDC.html#ff40--lcdc-lcd-control
export class LcdControlRegister implements ByteRef {
  enabled = true
  windowTilemap = 0
  windowEnabled = false
  tileDataArea = 1
  backgroundTilemap = 1
  objectSize: 8 | 16 = 8
  objectsEnabled = false
  backgroundWindowDisplay = true

  get byte(): number {
    return (
      (this.enabled ? 0x80 : 0) +
      (this.windowTilemap << 6) +
      (this.windowEnabled ? 0x20 : 0) +
      (this.tileDataArea << 4) +
      (this.backgroundTilemap << 3) +
      (this.objectSize == 16 ? 0x4 : 0) +
      (this.objectsEnabled ? 0x2 : 0) +
      (this.backgroundWindowDisplay ? 0x1 : 0)
    )
  }

  set byte(value: number) {
    this.enabled = (value & 0x80) > 0
    this.windowTilemap = (value & 0x40) >> 6
    this.windowEnabled = (value & 0x20) > 0
    this.tileDataArea = (value & 0x10) >> 4
    this.backgroundTilemap = (value & 0x8) >> 3
    this.objectSize = (value & 0x4) > 0 ? 16 : 8
    this.objectsEnabled = (value & 0x2) > 0
    this.backgroundWindowDisplay = (value & 0x1) > 0
  }
}

// Reference: https://gbdev.io/pandocs/STAT.html#ff41--stat-lcd-status
export class LcdStatusRegister implements ByteRef {
  lycInterruptEnabled = false
  mode2InterruptEnabled = false
  mode1InterruptEnabled = false
  mode0InterruptEnabled = false
  lycCoinciding = false
  mode = 0

  get byte(): number {
    return (
      (this.lycInterruptEnabled ? 0x40 : 0) +
      (this.mode2InterruptEnabled ? 0x20 : 0) +
      (this.mode1InterruptEnabled ? 0x10 : 0) +
      (this.mode0InterruptEnabled ? 0x8 : 0) +
      (this.lycCoinciding ? 0x4 : 0) +
      this.mode
    )
  }
  set byte(value: number) {
    this.lycInterruptEnabled = (value & 0x40) > 0
    this.mode2InterruptEnabled = (value & 0x20) > 0
    this.mode1InterruptEnabled = (value & 0x10) > 0
    this.mode0InterruptEnabled = (value & 0x8) > 0
  }
}

export class PalletteRegister implements ByteRef {
  map = [0, 0, 0, 0]

  get byte(): number {
    return (
      (this.map[0] << 0) +
      (this.map[1] << 2) +
      (this.map[2] << 4) +
      (this.map[3] << 6)
    )
  }
  set byte(value: number) {
    this.map = [
      (value >> 0) & 3,
      (value >> 2) & 3,
      (value >> 4) & 3,
      (value >> 6) & 3,
    ]
  }
}
