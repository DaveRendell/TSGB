import { MutableValue } from "../types"

export default class Memory {
  private data: Uint8Array

  bootRomLoaded = false
  private bootRom = new Uint8Array(0x100)
  private cartridge = new Uint8Array(0x8000)

  constructor(program: number[] = []) {
    this.data = new Uint8Array(0x10000)
    program.forEach((value, i) => this.at(i).write(value))
  }

  at(address: number): MutableValue<8> {
    if (address < 0x8000) { // Data is in ROM
      if (address < 0x100 && this.bootRomLoaded && this.data[0xFF50] === 0) {
        // If Boot ROM is enabled, loaded, and we're in its address range, load
        // memory from there
        return {
          intSize: 8,
          read: () => this.bootRom[address],
          write: () => {  }
        }
      }
      // TODO Memory Banking...
      return {
        intSize: 8,
        read: () => this.cartridge[address],
        write: () => {  }
      }
    }

    // TODO gamepad data
    if (address === 0xFF00) {
      return {
        intSize: 8,
        read: () => 0xCF,
        write: () => {}
      }
    }

    return {
      intSize: 8,
      read: () => this.data[address],
      write: (value: number) => { this.data[address] = value }
    }
  }
  
  async loadGame(file: File) {
    this.cartridge = (
      await file.stream().getReader().read()
    ).value || this.cartridge
  }

  async loadBootRom(file: File) {
    this.bootRom = (
      await file.stream().getReader().read()
    ).value || this.bootRom
    this.bootRomLoaded = true
  }
}