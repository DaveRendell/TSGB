export default class Memory {
  private data: Uint8Array

  constructor(program: number[] = []) {
    this.data = new Uint8Array(0x10000)
    program.forEach((value, i) => this.write8(i, value))
  }

  read8(address: number): number {
    return this.data[address]
  }

  write8(address: number, value: number): void {
    this.data[address] = value
  }
}