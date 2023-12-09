import { MutableValue } from "../types"
import Controller from "./controller"
import { setBit } from "./instructions/instructionHelpers"
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
    program.forEach((value, i) => this.atOldQQ(i).write(value))
    this.controller = controller
    controller.triggerInterrupt = () => {
      setBit(this.atOldQQ(0xFF0F), 4) // Joypad Interrupt flag ON
    }
  }

  atOldQQ(address: number): MutableValue<8> {
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

    // Gamepad data
    if (address === 0xFF00) {
      return {
        intSize: 8,
        read: () => this.controller.updatedRegister(this.data[address]),
        write: (value) => {
          this.data[address] = (value & 0xF0) + (this.data[address] & 0xF)
        }
      }
    }
    
    // OAM DMA Transfer
    if (address === 0xFF46) {
      return {
        intSize: 8,
        read: () => this.data[address],
        write: (value) => {
          this.data[address] = value
          this.dmaTransfer(value)
        }
      }
    }

    return {
      intSize: 8,
      read: () => this.data[address],
      write: (value: number) => { this.data[address] = value }
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
        return {
          get value(): number { return this.bootRom[address] },
          set value(_: number) {} 
        }
      }
      // TODO Memory Banking...
      return {
        get value(): number { return this.cartridge[address] },
        set value(_: number) {} 
      }
    }

    // IO Registers
    if (address >= 0xFF && address < 0xFF80) { 
      return this.registers.at(address)
    }

    // TODO remove this, handle each case explicitly
    return {
      get value(): number { return this.data[address & 0xFFFF] },
      set value(value: number) { this.data[address & 0xFFFF] = value }
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
    this.bootRom = (
      await file.stream().getReader().read()
    ).value || this.bootRom
    this.bootRomLoaded = true
    this.data[0xFF50] = 1
  }

  // https://gbdev.io/pandocs/OAM_DMA_Transfer.html
  dmaTransfer(registerValue: number) {
    const startAddress = registerValue << 8
    for (let i = 0; i < 0xA0; i++) {
      this.data[0xFE00 + i] = this.data[startAddress + i]
    }
  }
}