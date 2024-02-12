import { from2sComplement } from "../cpu/instructions/instructionHelpers"
import { ByteRef, GetSetByteRef } from "../refs/byteRef"
import { IoRegisters } from "./registers/ioRegisters"
import { VramBankRegister } from "./registers/vramBankRegister"
import { TileAttributes } from "./tileAttributes"

type Tile = number[][]

export class VRAM {
  data = [new Uint8Array(0x2000), new Uint8Array(0x2000)]

  tiles: [Tile[], Tile[]] = [[], []]

  tileAttributes0: TileAttributes[] = []
  tileAttributes1: TileAttributes[] = []

  vramBankRegister: VramBankRegister

  constructor(registers: IoRegisters) {
    this.vramBankRegister = registers.vramBank
    for (let tile = 0; tile < 384; tile++) {
      this.tiles[0].push([])
      this.tiles[1].push([])
      for (let row = 0; row < 8; row++) {
        this.tiles[0][tile].push([])
        this.tiles[0][tile][row] = new Array(8).fill(0)
        this.tiles[1][tile].push([])
        this.tiles[1][tile][row] = new Array(8).fill(0)
      }
      for (let t = 0; t < 0x400; t++) {
        this.tileAttributes0.push(new TileAttributes())
        this.tileAttributes1.push(new TileAttributes())
      }
    }
  }

  at(address: number): ByteRef {
    const adjustedAddress = address - 0x8000
    const tileNumber = adjustedAddress >> 4
    const rowNumber = (adjustedAddress & 0b1111) >> 1
    const read = () => {
      return this.data[this.vramBankRegister.bank][adjustedAddress]
    }
    const write = (value: number) => {
      this.data[this.vramBankRegister.bank][adjustedAddress] = value
      if (this.vramBankRegister.bank == 0) {
        if (address < 0x9800) {
          for (let i = 0; i < 8; i++) {
            const bit = (value & 1) << adjustedAddress % 2
            value >>= 1
            this.tiles[0][tileNumber][rowNumber][7 - i] &=
              1 << (1 - (adjustedAddress % 2))
            this.tiles[0][tileNumber][rowNumber][7 - i] |= bit
          }
        }
      } else {
        if (address < 0x9800) {
          for (let i = 0; i < 8; i++) {
            const bit = (value & 1) << adjustedAddress % 2
            value >>= 1
            this.tiles[1][tileNumber][rowNumber][7 - i] &=
              1 << (1 - (adjustedAddress % 2))
            this.tiles[1][tileNumber][rowNumber][7 - i] |= bit
          }
        } else {
          const attributes = this.tileAttributes0[address - 0x9800]
          attributes.priority = (value & 0x80) > 0
          attributes.yFlip = (value & 0x40) > 0
          attributes.xFlip = (value & 0x20) > 0
          attributes.bank = (value & 0x8) >> 3
          attributes.palette = value & 0x7
          if (attributes.bank == 1) { console.log("bank 2 used") }
        }
      }
      
    }
    return new GetSetByteRef(read, write)
  }

  tileset0(tileNumber: number, rowNumber: number, bank: number = 0): number[] {
    return this.tiles[bank][tileNumber][rowNumber]
  }

  tileset1(tileNumber: number, rowNumber: number, bank: number = 0): number[] {
    const adjustedTileNumber = 0x100 + from2sComplement(tileNumber)
    return this.tiles[bank][adjustedTileNumber][rowNumber]
  }

  // tilemap(tilemapId: number, index: number): number {
  //   return this.data[0][0x1800 + (tilemapId << 10) + index]
  // }

  tilemap0(id: number): number {
    return this.data[0][0x1800 + id]
  }

  tilemap1(id: number): number {
    return this.data[0][0x1c00 + id]
  }
}
