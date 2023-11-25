import { MutableValue } from "../types"

export default class Memory {
  private data: Uint8Array

  constructor(program: number[] = []) {
    this.data = new Uint8Array(0x10000)
    program.forEach((value, i) => this.write8(i, value))
  }

  at(address: number): MutableValue<8> {
    return {
      read: () => this.data[address],
      write: (value: number) => this.data[address] = value
    }
  }
}