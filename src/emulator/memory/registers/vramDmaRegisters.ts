import { ByteRef, GetSetByteRef } from "../../refs/byteRef"
import Memory from "../memoryMap"

export class VramDmaRegisters {
  sourceAddress: number = 0
  destinationAddress: number = 0
  startInstantTransfer = () => {

  }
  sourceHigh: ByteRef
  sourceLow: ByteRef
  destinationHigh: ByteRef
  destinationLow: ByteRef
  settings: ByteRef
  memory: Memory

  constructor(memory: Memory) {
    this.memory = memory
    this.sourceHigh = new GetSetByteRef(
      () => 0xff,
      (value) => {
        this.sourceAddress &= 0x00FF
        this.sourceAddress |= (value << 8)
      }
    )
    this.sourceLow = new GetSetByteRef(
      () => 0xff,
      (value) => {
        this.sourceAddress &= 0xFF00
        this.sourceAddress |= value
        this.sourceAddress &= 0xFFF0
      }
    )
    this.destinationHigh = new GetSetByteRef(
      () => 0xff,
      (value) => {
        this.destinationAddress &= 0x00FF
        this.destinationAddress |= (value << 8)
        this.destinationAddress &= 0x1FF0
        this.destinationAddress += 0x8000
      }
    )
    this.destinationLow = new GetSetByteRef(
      () => 0xff,
      (value) => {
        this.destinationAddress &= 0xFF00
        this.destinationAddress |= value
        this.destinationAddress &= 0x1FF0
        this.destinationAddress += 0x8000
      }
    )
    this.settings = new GetSetByteRef(
      () => 0xff,
      (value) => {
        // TODO: grab mode and only update on Hblanks in Hblank mode?
        const length = ((value &= 0x7F) + 1) << 4
        for (let i = 0; i < length; i++) {
          this.memory.at(this.destinationAddress + i).byte = this.memory.at(this.sourceAddress + i).byte
        }
      }
    )
  }

}