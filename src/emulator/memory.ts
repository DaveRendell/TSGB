import { MutableValue } from "../types"

export default class Memory {
  private data: Uint8Array

  constructor(program: number[] = []) {
    this.data = new Uint8Array(0x10000)
    program.forEach((value, i) => this.at(i).write(value))
  }

  at(address: number): MutableValue<8> {
    return {
      intSize: 8,
      read: () => this.data[address],
      write: (value: number) => { this.data[address] = value }
    }
  }

  async loadBios(file: File) {
    const byteArray = (await file.stream().getReader().read()).value
    if (byteArray) {
      byteArray.forEach((byte, i) => this.data[i] = byte)
    }
  }

  async loadGame(file: File) {
    const byteArray = (await file.stream().getReader().read()).value
    if (byteArray) {
      for (let i = 0x104; i <= 0x133; i++) {
        this.data[i] = byteArray[i]
      }
    }
  }
}