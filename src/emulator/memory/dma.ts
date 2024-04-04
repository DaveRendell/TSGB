import Memory from "./memoryMap";

export default class DMA {
  memory: Memory

  hblankVramDmaLength = 0
  hblankVramDmaSource: number
  hblankVramDmaDestination: number
  
  constructor(memory: Memory) {
    this.memory = memory
  }

  onHblank() {
    if (this.hblankVramDmaLength > 0) {
      console.log("Doing vram transfer in hblank")
      for (let i = 0; i < 0x10; i++) {
        this.memory.at(this.hblankVramDmaDestination + i).byte
          = this.memory.at(this.hblankVramDmaSource + i).byte
      }
      this.hblankVramDmaDestination += 0x10
      this.hblankVramDmaSource += 0x10
      this.hblankVramDmaLength -= 0x10
    }
  }

  setHblankVramDma(length: number, source: number, destination: number) {
    this.hblankVramDmaLength = length
    this.hblankVramDmaSource = source
    this.hblankVramDmaDestination = destination
  }

  getRemainingVramDmaLength() {
    return (Math.floor(this.hblankVramDmaLength / 0x10) - 1) & 0xff
  }
}