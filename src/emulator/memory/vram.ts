import { from2sComplement } from "../cpu/instructions/instructionHelpers"

export class VRAM {
  data: Uint8Array

  constructor(data: SharedArrayBuffer) {
    this.data = new Uint8Array(data)
  }

  tileset0(tileNumber: number, rowNumber: number): number[] {
    let byte0 = this.data[(tileNumber << 4) + (rowNumber << 1)]
    let byte1 = this.data[(tileNumber << 4) + (rowNumber << 1) + 1]
    let row = []
    for (let i = 7; i >= 0; i--) {
      const bit0 = byte0 & 1
      const bit1 = byte1 & 1
      row[i] = bit0 + (bit1 << 1)
      byte0 >>= 1
      byte1 >>= 1
    }
    return row
  }

  tileset1(tileNumber: number, rowNumber: number): number[] {
    const adjustedTileNumber = 0x100 + from2sComplement(tileNumber)
    return this.tileset0(adjustedTileNumber, rowNumber)
  }

  tilemap0(id: number): number {
    return this.data[0x1800 + id]
  }

  tilemap1(id: number): number {
    return this.data[0x1c00 + id]
  }
}
