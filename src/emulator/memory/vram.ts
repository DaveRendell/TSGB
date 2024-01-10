import { from2sComplement } from "../cpu/instructions/instructionHelpers"
import { ByteRef, GetSetByteRef } from "../refs/byteRef"

type Tile = number[][]

export class VRAM {
  data: Uint8Array = new Uint8Array(0x2000)
  tiles: Tile[] = []

  constructor() {
    for (let tile = 0; tile < 384; tile++) {
      this.tiles.push([])
      for (let row = 0; row < 8; row++) {
        this.tiles[tile].push([])
        this.tiles[tile][row] = new Array(8).fill(0)
      }
    }
  }

  at(address: number): ByteRef {
    const adjustedAddress = address - 0x8000
    const tileNumber = adjustedAddress >> 4
    const rowNumber = (adjustedAddress & 0b1111) >> 1
    const read = () => {
      return this.data[adjustedAddress]
    }
    const write = (value: number) => {
      this.data[adjustedAddress] = value
      if (address < 0x9800) {
        for (let i = 0; i < 8; i++) {
          const bit = (value & 1) << adjustedAddress % 2
          value >>= 1
          this.tiles[tileNumber][rowNumber][7 - i] &=
            1 << (1 - (adjustedAddress % 2))
          this.tiles[tileNumber][rowNumber][7 - i] |= bit
        }
      }
    }
    return new GetSetByteRef(read, write)
  }

  tileset0(tileNumber: number, rowNumber: number): number[] {
    return this.tiles[tileNumber][rowNumber]
  }

  tileset1(tileNumber: number, rowNumber: number): number[] {
    const adjustedTileNumber = 0x100 + from2sComplement(tileNumber)
    return this.tiles[adjustedTileNumber][rowNumber]
  }

  tilemap0(id: number): number {
    return this.data[0x1800 + id]
  }

  tilemap1(id: number): number {
    return this.data[0x1c00 + id]
  }
}
