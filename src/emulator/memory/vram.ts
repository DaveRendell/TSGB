import { from2sComplement } from "../cpu/instructions/instructionHelpers"
import { EmulatorMode } from "../emulator"
import { ByteRef, GetSetByteRef } from "../refs/byteRef"
import { IoRegisters } from "./registers/ioRegisters"
import { VramBankRegister } from "./registers/vramBankRegister"
import { TileAttributes } from "./tileAttributes"
import { TileStore } from "./tileStore"

type Tile = number[][]

export class VRAM {
  mode: EmulatorMode
  data = [new Uint8Array(0x2000), new Uint8Array(0x2000)]
  tileBanks = [new TileStore(0x180), new TileStore(0x180)]
  tileAttributes: TileAttributes[] = []

  vramBankRegister: VramBankRegister

  constructor(registers: IoRegisters, mode: EmulatorMode) {
    this.mode = mode
    this.vramBankRegister = registers.vramBank
    for (let t = 0; t < 0x800; t++) {
      this.tileAttributes.push(new TileAttributes())
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
      if (address < 0x9800) {
        this.tileBanks[this.vramBankRegister.bank].writeByte(adjustedAddress, value)
      } else {
        if (this.vramBankRegister.bank == 1) {
          const attributes = this.tileAttributes[address - 0x9800]
          attributes.priority = (value & 0x80) > 0
          attributes.yFlip = (value & 0x40) > 0
          attributes.xFlip = (value & 0x20) > 0
          attributes.bank = (value & 0x8) >> 3
          attributes.palette = value & 0x7
        }
      }
    }
    return new GetSetByteRef(read, write)
  }

  tileset(
    tileDataArea: number,
    tileIndex: number,
    bank: number,
    xFlip: boolean,
    yFlip: boolean,
    rowIndex: number,
  ): number[] {
    const adjustedTileIndex = tileDataArea == 1
      ? tileIndex
      : 0x100 + from2sComplement(tileIndex)
    
    return this.tileBanks[bank].readRow(adjustedTileIndex, rowIndex, xFlip, yFlip)
  }

  tileset0(tileNumber: number, rowNumber: number, bank: number = 0): number[] {
    bank = this.mode === EmulatorMode.CGB ? bank : 0
    return this.tileBanks[bank].readRow(tileNumber, rowNumber)
  }

  tileset1(tileNumber: number, rowNumber: number, bank: number = 0): number[] {
    tileNumber = 0x100 + from2sComplement(tileNumber)
    bank = this.mode === EmulatorMode.CGB ? bank : 0
    return this.tileBanks[bank].readRow(tileNumber, rowNumber)
  }

  tilemap(tilemapId: number, index: number): number {
    return this.data[0][0x1800 + (tilemapId << 10) + index]
  }

  tilemap0(id: number): number {
    return this.data[0][0x1800 + id]
  }

  tilemap1(id: number): number {
    return this.data[0][0x1c00 + id]
  }
}
