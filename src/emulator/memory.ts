import { MutableValue } from "../types"
import Controller from "./controller"
import { setBit } from "./instructions/instructionHelpers"
import { Interrupt } from "./memory/registers/interruptRegisters"
import { IoRegisters } from "./memory/registers/ioRegisters"
import { ByteRef } from "./refs/byteRef"
import { CompositeWordRef, WordRef } from "./refs/wordRef"

// Reference: https://gbdev.io/pandocs/Memory_Map.html
export default class Memory {
  private data: Uint8Array

  registers: IoRegisters = new IoRegisters()

  bootRomLoaded = false
  private bootRom = new Uint8Array(0x100)
  private cartridge = new Uint8Array(0x8000)

  controller: Controller

  constructor(controller: Controller, program: number[] = []) {
    this.data = new Uint8Array(0x10000)
    this.controller = controller
    controller.triggerInterrupt = () => {
      this.registers.interrupts.setInterrupt(Interrupt.Joypad)
    }
  }

  at(address: number): ByteRef {
    // ROM
    if (address < 0x8000) { 
      if (
        address < 0x100
        && this.bootRomLoaded
        && this.registers.bootRom.enabled
      ) {
        // If Boot ROM is enabled, loaded, and we're in its address range, load
        // memory from there
        const bootRom = this.bootRom
        return {
          get value(): number { return bootRom[address] },
          set value(_: number) {} 
        }
      }
      // TODO Memory Banking...
      const cartridge = this.cartridge
      return {
        get value(): number { return cartridge[address] },
        set value(_: number) {} 
      }
    }

    // IO Registers
    if (address >= 0xFF00 && address < 0xFF80) {
      const registers = this.registers
      return registers.at(address)
    }

    // TODO remove this, handle each case explicitly
    const data = this.data
    return {
      get value(): number { return data[address & 0xFFFF] },
      set value(value: number) { data[address & 0xFFFF] = value }
    }
  }

  wordAt(address: number): WordRef {
      return new CompositeWordRef(this.at(address + 1), this.at(address))
  }
  
  async loadGame(file: File) {
    this.cartridge = (
      await file.stream().getReader().read()
    ).value || this.cartridge
  }

  async loadBootRom(file: File) {
    // this.bootRom = (
    //   await file.stream().getReader().read()
    // ).value || this.bootRom
    // this.bootRomLoaded = true
    // this.data[0xFF50] = 1
  }

  // https://gbdev.io/pandocs/OAM_DMA_Transfer.html
  dmaTransfer(registerValue: number) {
    const startAddress = registerValue << 8
    for (let i = 0; i < 0xA0; i++) {
      this.data[0xFE00 + i] = this.data[startAddress + i]
    }
  }
}