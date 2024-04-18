import Memory from "./memoryMap";
import { VramDmaRegisters } from "./registers/vramDmaRegisters";

export default class DMA {
  memory: Memory
  register: VramDmaRegisters

  hblankVramDmaEnabled = false
  hblankVramDmaLength = 0
  
  constructor(memory: Memory) {
    this.memory = memory
    this.register = memory.registers.vramDma
  }

  onHblank() {
    if (this.hblankVramDmaEnabled && !this.memory.cpu.isHalted) {
      console.log("Doing vram transfer in hblank")
      
      this.memory.cpu.incrementClock(4) // overhead

      for (let i = 0; i < 0x10; i++) {
        this.memory.at(this.register.destinationAddress + i).byte
          = this.memory.at(this.register.sourceAddress + i).byte
        this.memory.cpu.incrementClock(4)
      }
      this.register.destinationAddress += 0x10
      this.register.destinationAddress &= 0x1ff0
      this.register.destinationAddress += 0x8000
      this.register.sourceAddress += 0x10
      this.register.sourceAddress &= 0xfff0
      this.hblankVramDmaLength -= 0x10


      if (this.hblankVramDmaLength <= 0) {
        this.hblankVramDmaEnabled = false
      }
    }
  }

  setHblankVramDma(enabled: boolean, length: number) {
    this.hblankVramDmaEnabled = enabled
    this.hblankVramDmaLength = length
  }

  getRemainingVramDmaLength() {
    return ((this.hblankVramDmaLength << 4) - 1) & 0x7f
  }
}